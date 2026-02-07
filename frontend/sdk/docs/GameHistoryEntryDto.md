
# GameHistoryEntryDto


## Properties

Name | Type
------------ | -------------
`id` | string
`date` | string
`status` | string
`score` | number
`mode` | string
`guesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`trackName` | string
`artistName` | string
`albumImageUrl` | string
`playlistName` | string

## Example

```typescript
import type { GameHistoryEntryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "date": null,
  "status": null,
  "score": null,
  "mode": null,
  "guesses": null,
  "trackName": null,
  "artistName": null,
  "albumImageUrl": null,
  "playlistName": null,
} satisfies GameHistoryEntryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GameHistoryEntryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


