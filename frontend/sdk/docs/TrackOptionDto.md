
# TrackOptionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`normalizedName` | string
`artist` | string
`normalizedArtist` | string
`isrc` | string
`albumImageUrl` | string
`albumName` | string
`albumUrl` | string
`releaseYear` | number

## Example

```typescript
import type { TrackOptionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "normalizedName": null,
  "artist": null,
  "normalizedArtist": null,
  "isrc": null,
  "albumImageUrl": null,
  "albumName": null,
  "albumUrl": null,
  "releaseYear": null,
} satisfies TrackOptionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackOptionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


