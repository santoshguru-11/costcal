import oci
import json
import tempfile
import os

# Test with your OCI credentials
credentials = {
    "userId": "ocid1.user.oc1..aaaaaaaap2ocafd76ywdb5njriht3w2vn7fg45vc2xqbfqw53zeue2dilt6q",
    "fingerprint": "78:c9:4d:b0:6d:9a:25:5e:6c:0e:e6:94:57:5b:ad:5a",
    "tenancyId": "ocid1.tenancy.oc1..aaaaaaaargwveli3zwyyeywzeex6x4zxqodjkbvnde4la7j5cckwioxqfncq",
    "region": "us-phoenix-1",
    "privateKey": """-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCPswRfuMevZaEs
ZaOOsbIPrMGVV4/NworsLbUDed/SxaG29xd60pKR4lkg3KZnMk4wzMOC6cCElCPQ
z+SZKpeXknhW9i+iD2ponaiYeIy16NbENGoy0OpSl7PS8pZ95+Uu9rO8sB7XsPTT
VRhrRY4QarWYsMPSC8BpEgjI1u2K5ZcymnECxg2/yW8C/t1EZIuf8BGv+22drwQr
rTXAT57AznYxsn9qeF4knI2m5+JwCdrbc+qKX0JyqLrGZsWtbA7cN319Fatw4A0q
mTuIqF64LtTLeMsmkJbvDFb/aBSvKC9bMUXHt48DF5dvxvYOoZzzpUAN53NegILK
bbcg4qCrAgMBAAECggEABIVvZ8uajMw3y/vOr5irr46R8K72mVS7pj6x6VAWWL1b
HzSbCoRBlFF42G3Y1npgt2xZ4m6UXheDIPjJioAqkNxM6P+J9CFkCbKcMV/pnXeb
+kRj6wFjvgGD6Ok1DvUS4u1kLlWkQskQiu2sfQONOrsAx7MYFi3EegnVOOx6QNp4
WtyUPaf3WkbT0gt/Djp3vCgHP6tBvz8O9hbQuHRngd70ZY7cWAmmXh02Zg9TbAZS
ywzA4u3GulhOqgqUL9IwVMD4k9ZSWCwU4WK91+b3E/c4L1oXKFv/L4IUdQEVnbkm
uk+R+ZSGs66GfO64bitUXoYiXFSz7bB9fJOABh1EgQKBgQDEEhQF8u6D8OEWfC0J
6og8eedIaknVMVqMk54F+BoPMe8Whe3rYlxF2ttHpNBexUAHW0DAmSnvMX9es7xL
hn/TlR+D7y57n83iPSXjqODAvv1+YTU0rKBxNBeyxxggLkyXcZDcLplP1emudBQp
6CtI9uaXr7aPOC3YPcFyRsvwiwKBgQC7nwsfjHbSx2+onr3TIwt9wIIIIWD4NJwz
aqXOSi4dzSOfq10MWM8SHB6SU9FPG4ykZq5UcQB6uDfiXIF6mVf522q+HBGfvWb0
3RwJVKFBvNF5WtXGV8b8U0Gen2oyuh7T0gA4ybknELhxHs6vu7jOay1Kc6lJKQCU
kQUWOAj0YQKBgF7qmYLfvZNl0rE939fDD7ynDs3Bloh8YedXttIQ7xyYAbQXlbuz
XBP9BNZD9RNLzdlB1bDm9KP0hEJmJCszq0HUGPOXoBr8m4CANY1mPZdRXgoGKOmc
//aNT0OemhFKGI3fzk6oyFMbrQpk6zX2TK3/yFV6HJhsi9T44GLf3u5NAoGAdihW
P/sdBedVuZKnJ2Xlob9v5KDoyceQK41ZeE4dNuVvLuojwlfXqKcO1cZ1heVqsEp+
NW2pCKAliagKXuRdlFwLoEhbDQeh5Emvk2y51YWNQmjjQnMbPONN6xCoN+Qg7/NL
8neP5DtSfOMS9Xc6jrzOnBm1Hf71f5rI4lJNyWECgYATXHIejM5zMntn71S4kjLi
+x2qMzA8XK5oTtUPLaQY2fc7n7YOyAMbSghgsjHDcEHCfW6Qu3vw2eI99Sci8lDx
xDf/FJrWd2gZ8qlBohQTRNCDt9LbLMSxuW8Pg8Ul4emkQO2e9Zl26GFYxL2gXDEG
LU6D73T2G43SMwPDpp5kSA==
-----END PRIVATE KEY-----"""
}

try:
    # Create OCI config
    config = {
        'user': credentials['userId'],
        'fingerprint': credentials['fingerprint'],
        'tenancy': credentials['tenancyId'],
        'region': credentials['region']
    }
    
    # Write private key to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as f:
        f.write(credentials['privateKey'])
        temp_key_file = f.name
    
    try:
        # Update config with key file path
        config['key_file'] = temp_key_file
        
        print("OCI Config created successfully")
        print("User:", config['user'])
        print("Tenancy:", config['tenancy'])
        print("Region:", config['region'])
        print("Key file:", config['key_file'])
        
        # Test compute client
        compute_client = oci.core.ComputeClient(config)
        print("Compute client created successfully")
        
        # Test listing instances
        instances = compute_client.list_instances(config['tenancy']).data
        print(f"Found {len(instances)} instances")
        
        for instance in instances[:5]:  # Show first 5 instances
            print(f"  - {instance.display_name} ({instance.lifecycle_state})")
            
    finally:
        # Clean up temporary file
        os.unlink(temp_key_file)
    
except Exception as e:
    print(f"OCI Error: {e}")
    import traceback
    traceback.print_exc()
