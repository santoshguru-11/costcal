#!/usr/bin/env python3
"""
OCI Resource Discovery using Python SDK
This script discovers OCI resources and outputs them as JSON
"""

import json
import sys
import oci
from oci.config import from_file
from oci.resource_search import ResourceSearchClient
from oci.resource_search.models import StructuredSearchDetails
import argparse

def discover_resources(tenancy_id, user_id, fingerprint, private_key, region):
    """Discover OCI resources using Python SDK"""
    
    try:
        # Create authentication details
        config = {
            "tenancy": tenancy_id,
            "user": user_id,
            "fingerprint": fingerprint,
            "key_content": private_key,
            "region": region
        }
        
        # Create resource search client
        resource_search_client = ResourceSearchClient(config)
        
        # Create search details
        search_details = StructuredSearchDetails(
            type="Structured",
            query="query all resources"
        )
        
        # Search for resources
        search_response = resource_search_client.search_resources(
            search_details=search_details
        )
        
        # Process results
        resources = []
        if search_response.data and search_response.data.items:
            for item in search_response.data.items:
                resource = {
                    "identifier": item.identifier,
                    "display_name": item.display_name,
                    "resource_type": item.resource_type,
                    "compartment_id": item.compartment_id,
                    "lifecycle_state": item.lifecycle_state,
                    "availability_domain": item.availability_domain,
                    "time_created": item.time_created.isoformat() if item.time_created else None,
                    "defined_tags": item.defined_tags or {},
                    "freeform_tags": item.freeform_tags or {},
                    "identity_context": item.identity_context or {}
                }
                resources.append(resource)
        
        return {
            "success": True,
            "resources": resources,
            "total_count": len(resources)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "resources": [],
            "total_count": 0
        }

def main():
    parser = argparse.ArgumentParser(description='Discover OCI resources')
    parser.add_argument('--tenancy-id', required=True, help='OCI Tenancy ID')
    parser.add_argument('--user-id', required=True, help='OCI User ID')
    parser.add_argument('--fingerprint', required=True, help='OCI Fingerprint')
    parser.add_argument('--private-key', required=True, help='OCI Private Key')
    parser.add_argument('--region', required=True, help='OCI Region')
    
    args = parser.parse_args()
    
    result = discover_resources(
        args.tenancy_id,
        args.user_id,
        args.fingerprint,
        args.private_key,
        args.region
    )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
