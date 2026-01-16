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

1. **제목(title)**: 명확하고 간결한 제목 (필수, 1~200자)
2. **설명(description)**: 테스트하는 내용에 대한 간단한 설명 (선택, 최대 500자)
3. **우선순위(priority)**: 필수, 정확히 다음 중 하나 - "low", "medium", "high" (모두 소문자)
4. **타입(type)**: 필수, 정확히 다음 중 하나 - "functional", "regression", "smoke", "integration", "performance", "security" (모두 소문자)
5. **단계(steps)**: 상세한 단계별 테스트 수행 방법 (선택, 문자열 배열, 각 단계는 간결하게)
6. **예상 결과(expected_result)**: 명확한 예상 결과 (선택, 최대 500자)
7. **태그(tags)**: 관련 태그 (선택, 문자열 배열, 각 태그는 짧게)

**필드 제약사항 (매우 중요!):**
- title: 필수, 1~200자 (초과 시 오류)
- description: 선택, 최대 500자
- priority: 필수, 반드시 "low", "medium", "high" 중 하나 (소문자만 허용)
- type: 필수, 반드시 "functional", "regression", "smoke", "integration", "performance", "security" 중 하나 (소문자만 허용)
- steps: 선택, 문자열 배열
- expected_result: 선택, 최대 500자
- tags: 선택, 문자열 배열

**출력 형식 요구사항:**
- 유효한 JSON 배열만 반환 (마크다운 코드블록 없이)
- 각 테스트 케이스는 JSON 객체
- priority와 type은 반드시 소문자로 작성
- steps와 tags는 문자열 배열
- **모든 내용은 한국어로 작성**

**출력 예시:**
[
  {
    "title": "유효한 이메일과 비밀번호로 로그인 성공",
    "description": "올바른 이메일과 비밀번호로 사용자가 로그인할 수 있는지 확인",
    "priority": "high",
    "type": "functional",
    "steps": [
      "로그인 페이지로 이동",
      "유효한 이메일 주소 입력",
      "유효한 비밀번호 입력",
      "로그인 버튼 클릭"
    ],
    "expected_result": "사용자가 성공적으로 인증되고 대시보드 페이지로 이동됨",
    "tags": ["로그인", "인증"]
  },
  {
    "title": "잘못된 비밀번호로 로그인 실패",
    "description": "잘못된 비밀번호 입력 시 로그인이 실패하고 오류 메시지가 표시되는지 확인",
    "priority": "high",
    "type": "functional",
    "steps": [
      "로그인 페이지로 이동",
      "유효한 이메일 주소 입력",
      "잘못된 비밀번호 입력",
      "로그인 버튼 클릭"
    ],
    "expected_result": "로그인 실패 메시지가 표시되고 로그인 페이지에 그대로 남아있음",
    "tags": ["로그인", "보안", "에러처리"]
  }
]

**중요 사항:**
- priority와 type은 반드시 소문자로만 작성하세요
- 현실적이고 실용적인 테스트 케이스를 작성하세요
- 긍정적 및 부정적 테스트 시나리오를 모두 포함하세요
- 엣지 케이스와 경계 조건을 포함하세요
- 제목은 200자를 절대 초과하지 마세요
- JSON만 반환하고 추가 텍스트나 마크다운 없이 출력하세요
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
