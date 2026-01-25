
# PlaylistDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`description` | string
`imageUrl` | string
`owner` | string
`totalTracks` | number
`isPublic` | boolean
`externalUrl` | string
`tracks` | [Array&lt;TrackDto&gt;](TrackDto.md)

## Example

```typescript
import type { PlaylistDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "description": null,
  "imageUrl": null,
  "owner": null,
  "totalTracks": null,
  "isPublic": null,
  "externalUrl": null,
  "tracks": null,
} satisfies PlaylistDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PlaylistDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


