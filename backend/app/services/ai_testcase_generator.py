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

    # System prompt for test case generation (Korean)
    system_prompt = """당신은 제품 요구사항 문서(PRD)로부터 포괄적인 테스트 케이스를 작성하는 전문 QA 엔지니어입니다.

PRD 내용을 분석하여 상세하고 실행 가능한 테스트 케이스를 생성하는 것이 당신의 임무입니다. 각 테스트 케이스에 대해 다음을 제공하세요:

1. **제목(title)**: 명확하고 간결한 제목 (50자 이내)
2. **설명(description)**: 테스트하는 내용에 대한 간단한 설명 (200자 이내)
3. **우선순위(priority)**: Low, Medium, High, Critical 중 하나
4. **타입(type)**: Functional, Regression, Smoke, Integration, Performance, Security 중 하나
5. **단계(steps)**: 상세한 단계별 테스트 수행 방법 (번호가 매겨진 목록)
6. **예상 결과(expected_result)**: 명확한 예상 결과
7. **태그(tags)**: 관련 태그 (예: "로그인", "인증", "보안")

**출력 형식 요구사항:**
- 테스트 케이스의 JSON 배열을 반환
- 각 테스트 케이스는 다음 키를 가진 JSON 객체여야 함: title, description, priority, type, steps, expected_result, tags
- Steps는 문자열 배열이어야 함
- Tags는 문자열 배열이어야 함
- Priority는 정확히 다음 중 하나여야 함: "Low", "Medium", "High", "Critical"
- Type은 정확히 다음 중 하나여야 함: "Functional", "Regression", "Smoke", "Integration", "Performance", "Security"
- **모든 내용은 한국어로 작성**

**출력 예시:**
```json
[
  {
    "title": "유효한 자격증명으로 로그인",
    "description": "올바른 이메일과 비밀번호로 사용자가 로그인할 수 있는지 확인",
    "priority": "Critical",
    "type": "Functional",
    "steps": [
      "로그인 페이지로 이동",
      "유효한 이메일 주소 입력",
      "유효한 비밀번호 입력",
      "로그인 버튼 클릭"
    ],
    "expected_result": "사용자가 성공적으로 인증되고 대시보드 페이지로 이동됨",
    "tags": ["로그인", "인증"]
  }
]
```

**중요 사항:**
- 현실적이고 실용적인 테스트 케이스를 작성하세요
- 긍정적 및 부정적 테스트 시나리오를 모두 포함하세요
- 엣지 케이스와 경계 조건을 포함하세요
- 단계가 명확하고 실행 가능하도록 작성하세요
- 설명은 간결하지만 유익하게 작성하세요
- 유효한 JSON만 반환하고, 추가 텍스트나 마크다운 형식은 포함하지 마세요
- **모든 테스트 케이스는 반드시 한국어로 작성해야 합니다**"""

    # User prompt with PRD content (Korean)
    project_context = f" 프로젝트 '{project_name}'에 대한" if project_name else ""
    user_prompt = f"""다음 PRD 내용을 바탕으로{project_context} 테스트 케이스를 생성해주세요:

{prd_content}

PRD에 언급된 모든 기능 영역을 포함하는 포괄적인 테스트 케이스를 한국어로 생성해주세요."""

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
                "model": "google/gemma-3-27b-it:free",
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
