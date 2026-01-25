# AuthApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**authControllerCallback**](AuthApi.md#authcontrollercallback) | **GET** /auth/callback | Handle Spotify OAuth callback |
| [**authControllerLogin**](AuthApi.md#authcontrollerlogin) | **GET** /auth/login | Start Spotify OAuth flow |
| [**authControllerLogout**](AuthApi.md#authcontrollerlogout) | **POST** /auth/logout | Logout and clear session |
| [**authControllerMe**](AuthApi.md#authcontrollerme) | **GET** /auth/me | Get current authenticated user |
| [**authControllerTokenLogin**](AuthApi.md#authcontrollertokenlogin) | **POST** /auth/token-login | Dev-only: Login with a manually obtained Spotify token |



## authControllerCallback

> authControllerCallback(code, state, error)

Handle Spotify OAuth callback

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthControllerCallbackRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthApi();

  const body = {
    // string
    code: code_example,
    // string
    state: state_example,
    // string
    error: error_example,
  } satisfies AuthControllerCallbackRequest;

  try {
    const data = await api.authControllerCallback(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **code** | `string` |  | [Defaults to `undefined`] |
| **state** | `string` |  | [Defaults to `undefined`] |
| **error** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to frontend after auth |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogin

> authControllerLogin()

Start Spotify OAuth flow

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthControllerLoginRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthApi();

  try {
    const data = await api.authControllerLogin();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to Spotify authorization |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogout

> authControllerLogout()

Logout and clear session

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthControllerLogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.authControllerLogout();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successfully logged out |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerMe

> AuthMeResponseDto authControllerMe()

Get current authenticated user

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthControllerMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.authControllerMe();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerTokenLogin

> authControllerTokenLogin(tokenLoginDto)

Dev-only: Login with a manually obtained Spotify token

Use this when you have a Spotify access token but can\&#39;t use OAuth flow. The token is validated by fetching your Spotify profile.

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthControllerTokenLoginRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthApi();

  const body = {
    // TokenLoginDto
    tokenLoginDto: ...,
  } satisfies AuthControllerTokenLoginRequest;

  try {
    const data = await api.authControllerTokenLogin(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tokenLoginDto** | [TokenLoginDto](TokenLoginDto.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successfully logged in |  -  |
| **401** | Invalid token |  -  |
| **403** | Not available in production |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

