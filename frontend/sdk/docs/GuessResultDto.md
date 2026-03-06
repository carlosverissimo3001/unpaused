
# GuessResultDto


## Properties

Name | Type
------------ | -------------
`result` | string
`gameOver` | boolean
`status` | string
`currentRound` | number
`snippetDuration` | number
`rankTitle` | string
`specialNote` | string
`meta` | object
`hints` | [Array&lt;HintDto&gt;](HintDto.md)

## Example

```typescript
import type { GuessResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "result": null,
  "gameOver": null,
  "status": null,
  "currentRound": null,
  "snippetDuration": null,
  "rankTitle": null,
  "specialNote": null,
  "meta": null,
  "hints": null,
} satisfies GuessResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GuessResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


