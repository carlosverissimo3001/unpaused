
# UpdateStreakQuestionDto


## Properties

Name | Type
------------ | -------------
`question` | string
`options` | Array&lt;string&gt;
`correctAnswerIndex` | number
`category` | string
`context` | string
`isActive` | boolean

## Example

```typescript
import type { UpdateStreakQuestionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "question": null,
  "options": null,
  "correctAnswerIndex": null,
  "category": null,
  "context": null,
  "isActive": null,
} satisfies UpdateStreakQuestionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateStreakQuestionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


