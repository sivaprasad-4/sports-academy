import requests
import csv
from io import StringIO

BASE_URL = 'http://127.0.0.1:8000/api'
SESSION = requests.Session()

def login(username, password):
    response = SESSION.post(f'{BASE_URL}/auth/login/', json={'username': username, 'password': password})
    if response.status_code == 200:
        data = response.json()
        SESSION.headers.update({'Authorization': f"Bearer {data['access']}"})
        return data['user']
    return None

def verify_report(report_type, expected_headers):
    print(f"\n--- Verifying Report: {report_type} ---")
    res = SESSION.get(f'{BASE_URL}/payments/history/export_csv/?type={report_type}')
    if res.status_code == 200:
        content = res.content.decode('utf-8')
        f = StringIO(content)
        reader = csv.reader(f)
        headers = next(reader)
        print(f"Headers: {headers}")
        
        # Check headers
        missing = [h for h in expected_headers if h not in headers]
        if not missing:
            print(f"SUCCESS: {report_type} headers correct.")
        else:
            print(f"FAILURE: Missing headers: {missing}")
            
        # Check if rows exist
        rows = list(reader)
        print(f"Data rows: {len(rows)}")
        if len(rows) > 0:
            print(f"Sample row: {[str(cell).encode('ascii', 'ignore').decode('ascii') for cell in rows[0]]}")
        else:
            print("No data rows found.")
    else:
        print(f"ERROR: Failed to fetch report: {res.status_code}")
        if res.status_code == 500:
            print("Internal Server Error - Check backend logs.")

def main():
    if not login('adminn', 'admin123'):
        print("Login failed.")
        return

    # 1. Transaction History (default)
    verify_report('transactions', ['Order ID', 'Athlete', 'Fee', 'Amount', 'Status', 'Date', 'Payment Method'])
    
    # 2. Athlete Financial Summary
    verify_report('athlete_summary', ['Athlete Name', 'Sport', 'Total Fees', 'Paid Amount', 'Balance', 'Status'])
    
    # 3. Monthly Revenue Report
    verify_report('monthly_summary', ['Month', 'Total Revenue Collected', 'Transactions'])

if __name__ == '__main__':
    main()
