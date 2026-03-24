import requests
import json

# Test registration
url = "http://localhost:8000/api/auth/register/"
data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "ATHLETE",
    "phone": "1234567890"
}

print("Testing registration API...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print()

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("\nRegistration successful!")
    else:
        print("\nRegistration failed!")
        
except Exception as e:
    print(f"Error: {e}")
