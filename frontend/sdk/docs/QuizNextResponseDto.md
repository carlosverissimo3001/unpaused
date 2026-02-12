
# QuizNextResponseDto


## Properties

Name | Type
------------ | -------------
`question` | [QuizQuestionDto](QuizQuestionDto.md)
`done` | boolean
`freezesAvailable` | number

## Example

```typescript
import type { QuizNextResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "question": null,
  "done": null,
  "freezesAvailable": null,
} satisfies QuizNextResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as QuizNextResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


