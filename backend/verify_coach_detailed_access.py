import requests
import json

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    url = f"{BASE_URL}/auth/login/"
    data = {"username": username, "password": password}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()['access']
    return None

def verify_coach_data_access():
    auth_token = get_token('testcoach', 'Admin@123')
    if not auth_token:
        print("Failed to login as testcoach")
        return

    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Fetch Batches
    print("\n--- Verifying Batches Access ---")
    batches_res = requests.get(f"{BASE_URL}/academy/batches/", headers=headers)
    if batches_res.status_code != 200:
        print(f"Failed to fetch batches: {batches_res.status_code}")
        return
    
    batches = batches_res.json().get('results', [])
    if not batches:
        print("No batches found for coach.")
        return
    
    batch_id = batches[0]['id']
    print(f"Checking athletes for Batch ID: {batch_id}")

    # 2. Fetch Athletes in Batch
    athletes_res = requests.get(f"{BASE_URL}/academy/batches/{batch_id}/athletes/", headers=headers)
    athletes = athletes_res.json()
    if not athletes:
        print("No athletes found in batch.")
        return
    
    athlete_id = athletes[0]['user']['id']
    print(f"Checking detailed metrics for Athlete ID: {athlete_id}")

    # 3. Fetch Attendance Stats
    print("\n--- Verifying Attendance Stats ---")
    att_stats_res = requests.get(f"{BASE_URL}/academy/attendance/stats/", params={"athlete_id": athlete_id}, headers=headers)
    if att_stats_res.status_code == 200:
        print("Attendance stats retrieved successfully:")
        print(json.dumps(att_stats_res.json(), indent=2))
    else:
        print(f"Failed to retrieve attendance stats: {att_stats_res.status_code}")

    # 4. Fetch Performance Summary
    print("\n--- Verifying Performance Summary ---")
    perf_summary_res = requests.get(f"{BASE_URL}/performance/results/summary/", params={"athlete_id": athlete_id}, headers=headers)
    if perf_summary_res.status_code == 200:
        summary_data = perf_summary_res.json()
        print(f"Performance summary retrieved successfully ({len(summary_data)} metrics).")
        if summary_data:
            print("First metric summary (sample):")
            print(json.dumps(summary_data[0], indent=2))
            
            # 5. Fetch Performance Trends
            metric_id = summary_data[0].get('metric_id')
            if metric_id:
                print(f"\n--- Verifying Performance Trends for Metric ID: {metric_id} ---")
                trends_res = requests.get(f"{BASE_URL}/performance/results/trends/", params={"athlete_id": athlete_id, "metric_id": metric_id}, headers=headers)
                if trends_res.status_code == 200:
                    print(f"Trends retrieved successfully ({len(trends_res.json())} data points).")
                else:
                    print(f"Failed to retrieve trends: {trends_res.status_code}")
                    print(trends_res.text)
    else:
        print(f"Failed to retrieve performance summary: {perf_summary_res.status_code}")
        print(perf_summary_res.text)

if __name__ == "__main__":
    verify_coach_data_access()
