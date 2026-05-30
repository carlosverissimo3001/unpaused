
# TrackResultDto


## Properties

Name | Type
------------ | -------------
`trackIndex` | number
`spotifyId` | string
`status` | [GameStatus](GameStatus.md)
`guesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)

## Example

```typescript
import type { TrackResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trackIndex": null,
  "spotifyId": null,
  "status": null,
  "guesses": null,
} satisfies TrackResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


