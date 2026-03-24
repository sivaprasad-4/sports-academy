import requests

# Get token
res = requests.post('http://localhost:8000/api/auth/login/', json={
    'username': 'adminn',
    'password': 'admin123'
})
token = res.json().get('access')

# Test export
headers = {'Authorization': f'Bearer {token}'}
res = requests.get('http://localhost:8000/api/payments/history/export_csv/?type=transactions', headers=headers)
print("Transactions:", res.status_code, res.text[:200])

res = requests.get('http://localhost:8000/api/payments/history/export_csv/?type=athlete_summary', headers=headers)
print("Athlete Summary:", res.status_code, res.text[:200])

res = requests.get('http://localhost:8000/api/payments/history/export_csv/?type=monthly_summary', headers=headers)
print("Monthly Summary:", res.status_code, res.text[:200])
