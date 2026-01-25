
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
`trackOptions` | [Array&lt;TrackOptionDto&gt;](TrackOptionDto.md)
`answer` | [TrackOptionDto](TrackOptionDto.md)

## Example

```typescript
import type { GameStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "sessionId": uuid-session-id,
  "currentRound": 2,
  "snippetDuration": 1,
  "status": playing,
  "guesses": null,
  "previewUrl": null,
  "trackOptions": null,
  "answer": null,
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


