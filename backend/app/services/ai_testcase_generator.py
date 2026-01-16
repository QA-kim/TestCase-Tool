"""
AI Test Case Generator using OpenRouter API
"""
import os
import logging
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def generate_testcases_from_prd(prd_content: str, project_name: str = "") -> List[Dict[str, Any]]:
    """
    Generate test cases from PRD content using OpenRouter API (Google Gemma model)

    Args:
        prd_content: The PRD content to analyze
        project_name: Optional project name for context

    Returns:
        List of test case dictionaries with title, description, steps, expected_result, etc.
    """
    openrouter_api_key = os.getenv('OPENROUTER_API_KEY')

    if not openrouter_api_key:
        logger.error("OpenRouter API key not configured")
        raise ValueError("OpenRouter API key not configured. Please set OPENROUTER_API_KEY in environment variables.")

    # System prompt for test case generation
    system_prompt = """You are a professional QA engineer specialized in creating comprehensive test cases from Product Requirement Documents (PRDs).

Your task is to analyze PRD content and generate detailed, actionable test cases. For each test case, provide:

1. **Title**: A clear, concise title (50 characters max)
2. **Description**: A brief description of what is being tested (200 characters max)
3. **Priority**: One of: Low, Medium, High, Critical
4. **Type**: One of: Functional, Regression, Smoke, Integration, Performance, Security
5. **Steps**: Detailed step-by-step testing instructions (numbered list)
6. **Expected Result**: Clear expected outcome
7. **Tags**: Relevant tags (comma-separated, e.g., "login, authentication, security")

**Output Format Requirements:**
- Return a JSON array of test cases
- Each test case must be a JSON object with these exact keys: title, description, priority, type, steps, expected_result, tags
- Steps should be a JSON array of strings
- Tags should be a JSON array of strings
- Priority must be exactly one of: "Low", "Medium", "High", "Critical"
- Type must be exactly one of: "Functional", "Regression", "Smoke", "Integration", "Performance", "Security"

**Example Output:**
```json
[
  {
    "title": "User login with valid credentials",
    "description": "Verify that users can successfully log in with correct email and password",
    "priority": "Critical",
    "type": "Functional",
    "steps": [
      "Navigate to login page",
      "Enter valid email address",
      "Enter valid password",
      "Click 'Login' button"
    ],
    "expected_result": "User is successfully authenticated and redirected to dashboard",
    "tags": ["login", "authentication"]
  }
]
```

**Important:**
- Focus on creating realistic, practical test cases
- Cover both positive and negative test scenarios
- Include edge cases and boundary conditions
- Ensure steps are clear and actionable
- Keep descriptions concise but informative
- Return ONLY valid JSON, no additional text or markdown formatting"""

    # User prompt with PRD content
    project_context = f" for project '{project_name}'" if project_name else ""
    user_prompt = f"""Generate test cases{project_context} based on the following PRD content:

{prd_content}

Please analyze the requirements and generate comprehensive test cases covering all functional areas mentioned in the PRD."""

    try:
        # Call OpenRouter API
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://testcase-e27a4.web.app",
                "X-Title": "TestCase Management System"
            },
            json={
                "model": "google/gemma-2-27b-it:free",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4000
            },
            timeout=120
        )

        response.raise_for_status()
        result = response.json()

        # Extract generated content
        if not result.get('choices') or len(result['choices']) == 0:
            logger.error("No choices returned from OpenRouter API")
            raise ValueError("No response generated from AI model")

        generated_text = result['choices'][0]['message']['content']
        logger.info(f"AI generated text length: {len(generated_text)}")

        # Parse JSON from generated text
        # Sometimes AI wraps JSON in markdown code blocks, so clean it
        import json
        import re

        # Remove markdown code blocks if present
        generated_text = re.sub(r'^```json\s*', '', generated_text.strip())
        generated_text = re.sub(r'\s*```$', '', generated_text.strip())
        generated_text = generated_text.strip()

        # Parse JSON
        try:
            testcases = json.loads(generated_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {e}")
            logger.error(f"Generated text: {generated_text[:500]}...")
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

        # Validate and normalize test cases
        if not isinstance(testcases, list):
            logger.error("AI response is not a JSON array")
            raise ValueError("AI response must be a JSON array of test cases")

        validated_testcases = []
        for tc in testcases:
            # Ensure all required fields are present
            validated_tc = {
                'title': tc.get('title', 'Untitled Test Case')[:50],
                'description': tc.get('description', '')[:200],
                'priority': tc.get('priority', 'Medium'),
                'type': tc.get('type', 'Functional'),
                'steps': tc.get('steps', []),
                'expected_result': tc.get('expected_result', ''),
                'tags': tc.get('tags', [])
            }

            # Validate priority and type
            valid_priorities = ['Low', 'Medium', 'High', 'Critical']
            valid_types = ['Functional', 'Regression', 'Smoke', 'Integration', 'Performance', 'Security']

            if validated_tc['priority'] not in valid_priorities:
                validated_tc['priority'] = 'Medium'

            if validated_tc['type'] not in valid_types:
                validated_tc['type'] = 'Functional'

            # Ensure steps is a list
            if isinstance(validated_tc['steps'], str):
                validated_tc['steps'] = [validated_tc['steps']]
            elif not isinstance(validated_tc['steps'], list):
                validated_tc['steps'] = []

            # Ensure tags is a list
            if isinstance(validated_tc['tags'], str):
                validated_tc['tags'] = [t.strip() for t in validated_tc['tags'].split(',')]
            elif not isinstance(validated_tc['tags'], list):
                validated_tc['tags'] = []

            validated_testcases.append(validated_tc)

        logger.info(f"Successfully generated {len(validated_testcases)} test cases")
        return validated_testcases

    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API request failed: {e}")
        raise ValueError(f"Failed to connect to OpenRouter API: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in AI test case generation: {e}")
        raise ValueError(f"Failed to generate test cases: {str(e)}")
