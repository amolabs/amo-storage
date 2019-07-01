# AMO Storage Service

## Introduction
Ceph adapter for Amo storage service.
- Support REST API for data operations
- Support JWT authorization


## How to Start
### Pre-requisites
- [Python3](https://www.python.org/downloads/release/python-368/) (compatible on 3.6.8)
- Python3-pip
- [Redis](https://redis.io/download)
	

### Configurations

#### CEPH Configuration
***NOTE:*** *This section is not for the CEPH's configuration or configuring the CEPH cluster itself but for connecting to existing CEPH properly.*
*The CEPH cluster is assumed the be constructed and configured separately.*

- The `access_key` and `secret_key` which are used for connecting to the **CEPH instance** can be found in the `key` attribute of CEPH user.
(We use only AMO's prepared user named `amoapi`)
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
The operations which need authorization process like `upload`, `download`, `remove` should be requested with authorization headers like below. 

#### Request Headers
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `X-Auth-Token` | `string` | **Required**. Received `JWT` |
| `X-Public-Key` | `string` | **Required**. User's public key (base64 url-safe encoded) |
| `X-Signature` | `string` | **Required**. Signed `JWT` (base64 url-safe encoded) |


To acquire `JWT`, client should have to send `POST` request to `auth` API with below data in the request body. 
```
{"user": user_identity, "operation": operation_name"}
```
The `user_indentity` is the account address described on [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md) and `operation_name` is operation's name and should be all lowercase names. The `operation_name` can be `"upload"`, `"download"`, `"remove"`. `inspect` operation is not included because `inspect` operation should be requested without `auth`. 

#### Error 
When error is occurred, server will return the proper HTTP error code with response body : `{"error":{ERROR_MESSAGE}}`.

#### Body Parameter Detail
Each API's request body parameter is well defined on [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md).
 
### Auth
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
  "token": JWT_TOKEN
}
```


### Upload
**Auth Required**
```http
POST /api/{api_version}/parcels
```
#### Request Body

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `owner` | `string` | **Required**. user_identity |
| `metadata` | `JSON object` | metadata |
| `data` | `string` | **Required**. hex_encoded_binary_sequence |

#### Response Body
```json
{
  "id": data_parcel_id
}
```

### Download
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

### Inspect
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

### Remove
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
