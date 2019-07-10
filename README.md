# AMO Storage Service

## Introduction
Ceph adapter for Amo storage service.
- Support RESTful API for data operations
- Support JWT authorization featuring challenge-response scheme


## How to Start
### Pre-requisites
- [Python3](https://www.python.org/downloads/release/python-368/) (compatible with 3.6.8)
- Python3-pip (compatible with 9.0.1)
- [Redis](https://redis.io/download) (compatible with 5.0.5)
- [Sqlite](https://www.sqlite.org/download.html) (compatible with 5.0.5)
	

### Configurations

#### CEPH Configuration
***NOTE:*** *This section is not for the CEPH's configuration or configuring the CEPH cluster itself but for connecting to existing CEPH properly.* 
***It is assumed that the CEPH cluster is constructed and configured separately*** and
***it is assumed that there exists a CEPH Rados Gateway running.***

- The `access_key` and `secret_key` which are used for connecting to the **Rados Gateway** can be found in the `key` attribute of CEPH user.
(We assume there is a Rados Gateway user `amoapi` for this adapter software. This may become configurable in the future version of this software.)
- The `access_key` and `secret_key` should be included in the `key.json` file.
```son
{
    "access_key":"{USER'S_ACCESS_KEY}",
    "secret_key":"{USER'S_SECRET_KEY}"
}
```

### Run
***NOTE:*** *Before starting AMO-Storage API server, `redis` server daemon must be running.*

To run AMO-Storage API server, some dependencies must be installed. Install via below command.
```shell
$ pip3 install -r requirements.txt
```

And then run flask server via below command.
```shell
$ python3 main.py 0.0.0.0:{PORT}
```

## APIs
### Authorization
The operations which need authorization process like `upload`, `download`, `remove` should be requested with authorization headers like below. 

#### Request Headers
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `X-Auth-Token` | `string` | **Required**. Received `ACCESS_TOKEN` |
| `X-Public-Key` | `string` | **Required**. User's public key (base64 url-safe encoded) |
| `X-Signature` | `string` | **Required**. Signed `ACCESS_TOKEN` (base64 url-safe encoded) |


To acquire `ACCESS_TOKEN`, client should have to send `POST` request to `auth` API with below data in the request body. 
```
{"user": user_identity, "operation": operation_name"}
```
The `user_indentity` is the account address described on [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md) and `operation_name` is operation's name and should be all lowercase names. The `operation_name` can be `"upload"`, `"download"`, `"remove"`. `inspect` operation is not included because `inspect` operation should be requested without `auth`. 

When the `ACCESS_TOKEN` is acquired, requesting client can construct request headers for an authorization. The request header must contains `X-Auth-Token`, `X-Public-Key`, `X-Signature` values. `X-Auth-Token` should be `ACCESS_TOKEN` value and `X-Public-Key` should be user's public key and it must be base64 url-safe encoded format. Finally, `X-Signature` should be `ACCESS_TOKEN` which is signed with user's private key and it must be base64 url-safe encoded format. Then, a client should send a request with those headers included.


#### Error 
When error is occurred, server will return the proper HTTP error code with response body : `{"error":{ERROR_MESSAGE}}`.

#### Body Parameter Detail
* Each request body is not Form-encoded but `JSON-encoded` format.
* Each API's request body parameter is well defined on [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md).

### Auth API
```http
POST /api/{api_version}/auth
```
#### Request Body

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `user` | `string` | **Required**. user_identity |
| `operation` | `string` | **Required**. operation_name |

#### Response Body

```json
{
  "token": ACCESS_TOKEN
}
```


### Upload API
**Auth Required**
```http
POST /api/{api_version}/parcels
```
#### Request Body

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `string` | **Required**. user_identity |
| `metadata` | `JSON object` | **Required**. metadata |
| `data` | `string` | **Required**. hex_encoded_binary_sequence |

##### Metadata form
Metadata field is a schemeless JSON form, but the `owner` field must be included.
```json
{
  "owner": user_identity, // Mandantory field
  ...
}
```

#### Response Body
```json
{
  "id": data_parcel_id
}
```

### Download API
**Auth Required**
```http
GET /api/{api_version}/parcels/{parcel_id}
```
#### Request Body
| Parameter | Type | Description |
| :--- | :--- | :--- |

#### Response Body
```json
{
  "id": data_parcel_id,
  "owner": user_indentity,
  "data": hex_encoded_binary_sequence
}
```

### Inspect API
```http
GET /api/{api_version}/parcels/{parcel_id}?key=metadata
```
#### Request Body
| Parameter | Type | Description |
| :--- | :--- | :--- |

#### Response Body
```json
{
  "id": data_parcel_id,
  "owner": user_indentity,
  "metadata": metadata
}
```

### Remove API
**Auth Required**
```http
DELETE /api/{api_version}/parcels/{parcel_id}
```
#### Request Body
| Parameter | Type | Description |
| :--- | :--- | :--- |

#### Response Body
```json
{}
```
