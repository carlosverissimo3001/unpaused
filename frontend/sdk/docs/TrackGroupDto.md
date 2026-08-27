
# TrackGroupDto


## Properties

Name | Type
------------ | -------------
`id` | string
`type` | string
`name` | string
`slug` | string
`trackCount` | number
`imageUrl` | string

## Example

```typescript
import type { TrackGroupDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "type": null,
  "name": 1980s,
  "slug": 1980s,
  "trackCount": 490,
  "imageUrl": null,
} satisfies TrackGroupDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TrackGroupDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


