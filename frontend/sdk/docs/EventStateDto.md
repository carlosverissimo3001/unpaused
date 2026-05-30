
# EventStateDto


## Properties

Name | Type
------------ | -------------
`trackIndex` | number
`totalTracks` | number
`currentRound` | number
`maxRounds` | number
`snippetDuration` | number
`previewUrl` | string
`isComplete` | boolean
`currentGuesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`trackResults` | [Array&lt;TrackResultDto&gt;](TrackResultDto.md)

## Example

```typescript
import type { EventStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trackIndex": null,
  "totalTracks": null,
  "currentRound": null,
  "maxRounds": null,
  "snippetDuration": null,
  "previewUrl": null,
  "isComplete": null,
  "currentGuesses": null,
  "trackResults": null,
} satisfies EventStateDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EventStateDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


