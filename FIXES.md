# Quiz Grading Fix - October 3, 2025

## Issue
Quiz completion was showing "NaN%" and "0 out of 0 questions correct" instead of actual scores.

## Root Causes

1. **Incorrect API Parameters**: Frontend was sending the entire `question` object to the grading API, but the API expected individual fields:
   - `question` (string): The question text
   - `userAnswer` (string): User's answer
   - `correctAnswer` (string): The correct answer
   - `questionType` (string): Type of question (multiple-choice, true-false, open-ended)

2. **NaN Score Calculation**: Division by zero when `results.length` was 0

3. **Missing userAnswer in Results**: The grading result didn't include the user's answer for display

## Changes Made

### File: `/app/quiz/page.tsx`

#### Change 1: Fixed API Call (Lines 107-122)
**Before:**
```typescript
body: JSON.stringify({
  action: "grade",
  question,
  userAnswer,
}),
```

**After:**
```typescript
body: JSON.stringify({
  action: "grade",
  question: question.question,
  userAnswer,
  correctAnswer: question.correctAnswer,
  questionType: question.type,
}),
```

#### Change 2: Fixed Score Calculation (Line 302)
**Before:**
```typescript
const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
```

**After:**
```typescript
const totalScore = results.length > 0 ? results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length : 0
```

#### Change 3: Added userAnswer to Results (Line 130)
**Before:**
```typescript
quizResults.push(data.result)
```

**After:**
```typescript
quizResults.push({
  questionId: question.id,
  userAnswer,
  ...data
})
```

#### Change 4: Added Debug Logging
Added console.log statements to help troubleshoot:
- Before grading each question
- After receiving grading result
- For all final results
- On grading errors

## Testing

After these fixes, the quiz should:
1. ✅ Display correct scores (0-100%)
2. ✅ Show "X out of Y questions correct"
3. ✅ Display user's answers alongside correct answers
4. ✅ Work for all three question types (MC, TF, open-ended)
5. ✅ Handle edge cases (no answers provided, empty results)

## Verification Steps

1. Open http://localhost:3000/quiz
2. Start a quiz with 3 questions
3. Answer all questions
4. Submit the quiz
5. Check that:
   - Score percentage is displayed correctly (not NaN)
   - Question count is correct (not 0 out of 0)
   - Your answers are shown
   - Correct/incorrect indicators appear
   - Feedback is provided

## API Response Format

The grading API now correctly returns:
```json
{
  "score": 100,
  "isCorrect": true,
  "feedback": "Correct! Well done.",
  "citations": []
}
```

This gets merged with:
```json
{
  "questionId": "mcq-xxx-0",
  "userAnswer": "User's answer text"
}
```

To create the final QuizResult object.
