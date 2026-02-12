
# AuthMeResponseDto


## Properties

Name | Type
------------ | -------------
`spotifyUserId` | string
`displayName` | string
`avatarUrl` | string
`isTrusted` | boolean
`isAdmin` | boolean

## Example

```typescript
import type { AuthMeResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "spotifyUserId": null,
  "displayName": null,
  "avatarUrl": null,
  "isTrusted": false,
  "isAdmin": false,
} satisfies AuthMeResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuthMeResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


