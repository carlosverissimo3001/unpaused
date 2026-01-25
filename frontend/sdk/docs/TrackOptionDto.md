
# TrackOptionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`artist` | string
`albumImageUrl` | string

## Example

```typescript
import type { TrackOptionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": 7ouMYWpwJ422jRcDASAM9z,
  "name": Grenade,
  "artist": Bruno Mars,
  "albumImageUrl": https://i.scdn.co/image/...,
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


