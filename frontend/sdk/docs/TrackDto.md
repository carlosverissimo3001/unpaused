
# TrackDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`artists` | Array&lt;string&gt;
`albumName` | string
`imageUrl` | string
`durationMs` | number
`externalUrl` | string
`previewUrl` | string
`isPlayable` | boolean
`primaryArtist` | string
`popularity` | number
`isExplicit` | boolean

## Example

```typescript
import type { TrackDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "artists": null,
  "albumName": null,
  "imageUrl": null,
  "durationMs": null,
  "externalUrl": null,
  "previewUrl": null,
  "isPlayable": null,
  "primaryArtist": null,
  "popularity": null,
  "isExplicit": null,
} satisfies TrackDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


