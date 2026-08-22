
# SubmitGauntletGuessDto


## Properties

Name | Type
------------ | -------------
`playlistId` | string
`trackId` | string
`skip` | boolean
`trackName` | string
`artistName` | string
`isrc` | string
`albumName` | string

## Example

```typescript
import type { SubmitGauntletGuessDto } from ''

// TODO: Update the object below with actual values
const example = {
  "playlistId": null,
  "trackId": null,
  "skip": null,
  "trackName": null,
  "artistName": null,
  "isrc": null,
  "albumName": null,
} satisfies SubmitGauntletGuessDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SubmitGauntletGuessDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


