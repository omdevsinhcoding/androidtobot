import aiohttp
import re
import logging

SMS_API_URL = "http://161.118.182.184:4000/sms/latest"

async def fetch_latest_matching_sms(match_regex: str):
    """
    Fetches the latest SMS and checks if it matches the service.
    Returns (True, SMS_DATA) if it matches.
    Returns (False, None) if not matching or error.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(SMS_API_URL, timeout=5) as response:
                if response.status != 200:
                    return False, None
                
                data = await response.json()
                sms_text = data.get("text", "")
                
                # Check for regex match in SMS text
                if re.search(match_regex, sms_text, re.IGNORECASE):
                    return True, data
                
                return False, None
    except Exception as e:
        logging.error(f"Error fetching SMS: {e}")
        return False, None
