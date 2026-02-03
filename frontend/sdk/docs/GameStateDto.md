
# GameStateDto


## Properties

Name | Type
------------ | -------------
`sessionId` | string
`currentRound` | number
`snippetDuration` | number
`status` | string
`guesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`previewUrl` | string
`answer` | [TrackOptionDto](TrackOptionDto.md)
`rankTitle` | string
`specialNote` | string
`meta` | object

## Example

```typescript
import type { GameStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "sessionId": null,
  "currentRound": null,
  "snippetDuration": null,
  "status": null,
  "guesses": null,
  "previewUrl": null,
  "answer": null,
  "rankTitle": null,
  "specialNote": null,
  "meta": null,
} satisfies GameStateDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GameStateDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


