
# TrackRevealDto


## Properties

Name | Type
------------ | -------------
`trackId` | string
`trackName` | string
`artistName` | string
`albumImageUrl` | string
`albumName` | string
`dossier` | [TrackDossierDto](TrackDossierDto.md)

## Example

```typescript
import type { TrackRevealDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trackId": null,
  "trackName": null,
  "artistName": null,
  "albumImageUrl": null,
  "albumName": null,
  "dossier": null,
} satisfies TrackRevealDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackRevealDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


