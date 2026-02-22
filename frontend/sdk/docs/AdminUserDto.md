
# AdminUserDto


## Properties

Name | Type
------------ | -------------
`id` | string
`spotifyUserId` | string
`displayName` | string
`avatarUrl` | string
`isTrusted` | boolean
`isAdmin` | boolean
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { AdminUserDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "spotifyUserId": null,
  "displayName": null,
  "avatarUrl": null,
  "isTrusted": null,
  "isAdmin": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies AdminUserDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


