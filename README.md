# AMO Storage Service

## Introduction
Ceph adapter for Amo storage service.
- Support REST API for data operations
- Support JWT authorization


## Installation
### Pre-requisites
- [Python3]() (compatible on 3.6.8)
- [Python3-pip]()
- pip3 install -r requirements.txt

### Run
`python3 main.py 0.0.0.0:[PORT]`

### Connecting to CEPH Cluster
**NOTE:** *This section is not for the CEPH's configuration or configuring the CEPH cluster itself.*
*The CEPH cluster is assumed the be constructed and configured separately.*

- The `access_key` and `secret_key` which are used for connecting to the **CEPH instance** can be found in the `key` attribute of CEPH user.
(We use only AMO's prepared user named `amoapi`)
- The `access_key` and `secret_key` should be included in the `key.json` file
```son
{
    "access_key":"{USER'S_ACCESS_KEY}",
    "secret_key":"{USER'S_SECRET_KEY}"
}
```

#### CephAdaper
- Each **key** used for storing, removing, downing CEPH object(data) is `parcel_id`. See the [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md).
- `CephAdaper` module supports following functions using [CEPH S3 API](http://docs.ceph.com/docs/master/radosgw/s3/objectops/)
	- **Connect** to CEPH cluster using keys in the `key.json` file.
	- **Upload** the data with **parcel_id** as key.
	- **Download** the data with **parcel_id** as key.
	- **Remove** the data with **parcel_id** as key.



## Auth Flow
Should be performed before the operation which needs authorization process is called
1. Client sends `POST` request to `/auth` with `{"user": user_identity, "operation": operation_name"}` in the request body.
2. Server generates `JWT` with below format and response the `JWT`
	```python
	import base64

	HEADER = base64.urlsafe_b64encode(json.dumps({
		"typ": "JWT",
		"alg": "HS256"
	}))
	
	# The jti field is used to give the server randomness as a one-time token.
	PAYLOAD = base64.urlsafe_b64encode(json.dumps({
		"iss": "amo-storage-service",
		"user": user_identity,
		"operation": operation_name,
		"jti": uuid
	}))
	# By signing with the secret key managed by the server, it ensures that it is a token published by the server itself.
	SIGNATURE = base64.urlsafe_b64encode(HMACSHA256(HEADER + "." + PAYLOAD), secret))

	JWT = HEADER + "." + PAYLOAD + "." + SIGNATURE 
	```

3. When client sends request for any operation which need authorization process(`upload`, `download`, `remove`), the request should be sent with authorization headers like below. 

	```
	X-Auth-Token: Received JWT
	X-Public-Key: User's public key (base64 url-safe encoded)
	X-Signature: Signed JWT (base64 url-safe encoded) 
	```
	
4. Then server verifies the `X-signature` with client's `X-Public-Key` to check whether the request is sent from valid client and whether the `X-Auth-Token` is published by server itself.

5. If the verification is succeed, the server executes the operation that client requests.

6. When the operation is succeed, the server removes the JWT token from its store.

## APIs
***NOTE:*** The operations which need authorization process like `upload`, `download`, `remove` should be called with authorization headers like we explained on the `Auth Flow` section.


Each API's request body parameter is well defined on [AMO storage Documents](https://github.com/amolabs/docs/blob/master/storage.md)
 
### Auth
```http
POST /api/{api_version}/auth
```
##### Request Body

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `user` | `string` | **Required**. user_identity |
| `operation` | `string` | **Required**. operation_name |

##### Response Body

```json
{
  "token": JWT_TOKEN
}
```

##### Status Code
| Code | Description |
| :--- | :--- |
| `200` | Success |
| `401` | Invalid signature |


### Upload
**Auth Required**



### Download
**Auth Required**

### Inspect

### Remove
**Auth Required**

