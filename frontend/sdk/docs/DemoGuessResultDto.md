
# DemoGuessResultDto


## Properties

Name | Type
------------ | -------------
`correct` | boolean
`status` | string
`attempt` | number
`totalAttempts` | number
`snippetDuration` | number
`wrongIds` | Array&lt;string&gt;
`answer` | [DemoAnswerDto](DemoAnswerDto.md)

## Example

```typescript
import type { DemoGuessResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "correct": null,
  "status": null,
  "attempt": null,
  "totalAttempts": null,
  "snippetDuration": null,
  "wrongIds": null,
  "answer": null,
} satisfies DemoGuessResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DemoGuessResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


