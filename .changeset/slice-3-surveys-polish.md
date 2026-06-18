---
"@tour-kit/surveys": minor
---

Honor `RatingScale.step` in the rating question (previously hardcoded to `1`) and call
`QuestionConfig.validation` on advance — a non-null return surfaces a field error and blocks
moving to the next question. Both fields were already typed; this makes them work.

- `nextQuestion` now returns `string | null`: the validation error when the current question
  blocks advancing, or `null` on success (return-type widening — non-breaking for existing callers).
- New `getValidationError(surveyId, questionId)` on the surveys context and `validationError(questionId)`
  on `useSurvey` read the transient error for accessible rendering (`role="alert"`, `aria-invalid`,
  `aria-describedby`). Validation errors are in-memory only and are never persisted, so a reload starts clean.
