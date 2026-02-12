
# QuizResultDto


## Properties

Name | Type
------------ | -------------
`correct` | boolean
`freezeEarned` | boolean
`freezesAvailable` | number
`correctAnswerIndex` | number

## Example

```typescript
import type { QuizResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "correct": null,
  "freezeEarned": null,
  "freezesAvailable": null,
  "correctAnswerIndex": null,
} satisfies QuizResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as QuizResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


