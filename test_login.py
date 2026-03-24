import requests
import json

# Test login
url = "http://localhost:8000/api/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login API...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print()

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✓ Login successful!")
    else:
        print("\n✗ Login failed!")
        
except Exception as e:
    print(f"Error: {e}")
