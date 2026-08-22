
# TrackEntity


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`artistName` | string
`albumImageUrl` | string
`albumName` | string
`albumUrl` | string
`releaseYear` | number
`isrc` | string
`previewUrl` | string
`previewRef` | string
`lastScrapedAt` | Date
`createdAt` | Date
`updatedAt` | Date
`metadata` | [TrackMetadataVo](TrackMetadataVo.md)
`allArtists` | Array&lt;string&gt;

## Example

```typescript
import type { TrackEntity } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "artistName": null,
  "albumImageUrl": null,
  "albumName": null,
  "albumUrl": null,
  "releaseYear": null,
  "isrc": null,
  "previewUrl": null,
  "previewRef": null,
  "lastScrapedAt": null,
  "createdAt": null,
  "updatedAt": null,
  "metadata": null,
  "allArtists": null,
} satisfies TrackEntity

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackEntity
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


