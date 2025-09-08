#!/usr/bin/env python3
"""
OCI Inventory Service - Python-only implementation
Discovers OCI resources using the Python SDK
"""

import json
import sys
import os
import tempfile
from typing import Dict, List, Any, Optional
import oci
from oci.identity import IdentityClient
from oci.core import ComputeClient, BlockstorageClient, VirtualNetworkClient
from oci.object_storage import ObjectStorageClient
from oci.database import DatabaseClient
from oci.load_balancer import LoadBalancerClient

class OCIInventoryService:
    def __init__(self, credentials: Dict[str, Any]):
        """
        Initialize OCI service with credentials
        
        Args:
            credentials: Dictionary containing OCI credentials
        """
        self.credentials = credentials
        self.config = self._build_config()
        
    def _build_config(self) -> Dict[str, Any]:
        """Build OCI config from credentials"""
        return {
            "user": self.credentials["userId"],
            "key_file": None,
            "fingerprint": self.credentials["fingerprint"],
            "tenancy": self.credentials["tenancyId"],
            "region": self.credentials["region"],
            "key_content": self.credentials["privateKey"]
        }
    
    def validate_credentials(self) -> bool:
        """Validate OCI credentials by testing authentication"""
        try:
            identity_client = IdentityClient(self.config)
            # Try to get user info to validate credentials
            user_response = identity_client.get_user(self.credentials["userId"])
            return user_response.status == 200
        except Exception as e:
            print(f"OCI credential validation failed: {e}", file=sys.stderr)
            return False
    
    def discover_resources(self) -> Dict[str, Any]:
        """Discover all OCI resources"""
        try:
            print(f"OCI Config: user={self.config['user'][:20]}..., tenancy={self.config['tenancy'][:20]}..., region={self.config['region']}", file=sys.stderr)
            
            # Initialize clients
            identity_client = IdentityClient(self.config)
            compute_client = ComputeClient(self.config)
            blockstorage_client = BlockstorageClient(self.config)
            object_storage_client = ObjectStorageClient(self.config)
            database_client = DatabaseClient(self.config)
            load_balancer_client = LoadBalancerClient(self.config)
            vcn_client = VirtualNetworkClient(self.config)
            
            # Get all compartments
            compartments = self._get_compartments(identity_client)
            
            # Discover resources
            resources = {
                "compute_instances": [],
                "block_volumes": [],
                "object_storage_buckets": [],
                "autonomous_databases": [],
                "load_balancers": [],
                "vcns": []
            }
            
            for compartment in compartments:
                compartment_id = compartment["id"]
                compartment_name = compartment["name"]
                
                # Discover compute instances
                resources["compute_instances"].extend(
                    self._discover_compute_instances(compute_client, compartment_id, compartment_name)
                )
                
                # Discover block volumes
                resources["block_volumes"].extend(
                    self._discover_block_volumes(blockstorage_client, compartment_id, compartment_name)
                )
                
                # Discover object storage buckets
                resources["object_storage_buckets"].extend(
                    self._discover_object_storage_buckets(object_storage_client, compartment_id, compartment_name)
                )
                
                # Discover autonomous databases
                resources["autonomous_databases"].extend(
                    self._discover_autonomous_databases(database_client, compartment_id, compartment_name)
                )
                
                # Discover load balancers
                resources["load_balancers"].extend(
                    self._discover_load_balancers(load_balancer_client, compartment_id, compartment_name)
                )
                
                # Discover VCNs
                resources["vcns"].extend(
                    self._discover_vcns(vcn_client, compartment_id, compartment_name)
                )
            
            print("OCI Python all completed successfully", file=sys.stderr)
            return resources
            
        except Exception as e:
            print(f"OCI discovery error: {e}", file=sys.stderr)
            raise e
    
    def _get_compartments(self, identity_client: IdentityClient) -> List[Dict[str, str]]:
        """Get all accessible compartments"""
        try:
            compartments_response = identity_client.list_compartments(
                compartment_id=self.credentials["tenancyId"],
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            )
            
            compartments = []
            for compartment in compartments_response.data:
                compartments.append({
                    "id": compartment.id,
                    "name": compartment.name
                })
            
            return compartments
        except Exception as e:
            print(f"Error getting compartments: {e}", file=sys.stderr)
            return []
    
    def _discover_compute_instances(self, compute_client: ComputeClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover compute instances"""
        try:
            instances_response = compute_client.list_instances(
                compartment_id=compartment_id
            )
            
            instances = []
            for instance in instances_response.data:
                instances.append({
                    "id": instance.id,
                    "display_name": instance.display_name,
                    "shape": instance.shape,
                    "state": instance.lifecycle_state,
                    "compartment": compartment_name
                })
            
            return instances
        except Exception as e:
            print(f"Error discovering compute instances: {e}", file=sys.stderr)
            return []
    
    def _discover_block_volumes(self, blockstorage_client: BlockstorageClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover block volumes"""
        try:
            volumes_response = blockstorage_client.list_volumes(
                compartment_id=compartment_id
            )
            
            volumes = []
            for volume in volumes_response.data:
                volumes.append({
                    "id": volume.id,
                    "display_name": volume.display_name,
                    "size_gb": volume.size_in_gbs,
                    "state": volume.lifecycle_state,
                    "compartment": compartment_name
                })
            
            return volumes
        except Exception as e:
            print(f"Error discovering block volumes: {e}", file=sys.stderr)
            return []
    
    def _discover_object_storage_buckets(self, object_storage_client: ObjectStorageClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover object storage buckets"""
        try:
            # Get namespace
            namespace_response = object_storage_client.get_namespace()
            namespace = namespace_response.data
            
            buckets_response = object_storage_client.list_buckets(
                namespace_name=namespace,
                compartment_id=compartment_id
            )
            
            buckets = []
            for bucket in buckets_response.data:
                buckets.append({
                    "id": bucket.name,
                    "display_name": bucket.name,
                    "namespace": namespace,
                    "compartment": compartment_name
                })
            
            return buckets
        except Exception as e:
            print(f"Error discovering object storage buckets: {e}", file=sys.stderr)
            return []
    
    def _discover_autonomous_databases(self, database_client: DatabaseClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover autonomous databases"""
        try:
            databases_response = database_client.list_autonomous_databases(
                compartment_id=compartment_id
            )
            
            databases = []
            for database in databases_response.data:
                databases.append({
                    "id": database.id,
                    "display_name": database.display_name,
                    "db_name": database.db_name,
                    "lifecycle_state": database.lifecycle_state,
                    "compartment": compartment_name
                })
            
            return databases
        except Exception as e:
            print(f"Error discovering autonomous databases: {e}", file=sys.stderr)
            return []
    
    def _discover_load_balancers(self, load_balancer_client: LoadBalancerClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover load balancers"""
        try:
            load_balancers_response = load_balancer_client.list_load_balancers(
                compartment_id=compartment_id
            )
            
            load_balancers = []
            for lb in load_balancers_response.data:
                load_balancers.append({
                    "id": lb.id,
                    "display_name": lb.display_name,
                    "shape_name": lb.shape_name,
                    "lifecycle_state": lb.lifecycle_state,
                    "compartment": compartment_name
                })
            
            return load_balancers
        except Exception as e:
            print(f"Error discovering load balancers: {e}", file=sys.stderr)
            return []
    
    def _discover_vcns(self, vcn_client: VirtualNetworkClient, compartment_id: str, compartment_name: str) -> List[Dict[str, Any]]:
        """Discover Virtual Cloud Networks"""
        try:
            vcns_response = vcn_client.list_vcns(
                compartment_id=compartment_id
            )
            
            vcns = []
            for vcn in vcns_response.data:
                vcns.append({
                    "id": vcn.id,
                    "display_name": vcn.display_name,
                    "cidr_block": vcn.cidr_block,
                    "lifecycle_state": vcn.lifecycle_state,
                    "compartment": compartment_name
                })
            
            return vcns
        except Exception as e:
            print(f"Error discovering VCNs: {e}", file=sys.stderr)
            return []

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OCI Resource Discovery')
    parser.add_argument('--credentials', required=True, help='OCI credentials JSON or file path')
    parser.add_argument('--operation', default='all', choices=['all', 'compute', 'storage', 'database', 'network'], help='Resource type to discover')
    
    args = parser.parse_args()
    
    try:
        # Parse credentials
        if args.credentials.startswith('/') or args.credentials.startswith('./'):
            with open(args.credentials, 'r') as f:
                credentials = json.loads(f.read())
        else:
            credentials = json.loads(args.credentials)
        
        # Create service and discover resources
        service = OCIInventoryService(credentials)
        
        if args.operation == 'all':
            result = service.discover_resources()
        else:
            # For specific operations, we could implement targeted discovery
            result = service.discover_resources()
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
