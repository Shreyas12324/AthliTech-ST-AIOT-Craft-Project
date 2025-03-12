import asyncio
from bleak import BleakScanner, BleakClient

DEVICE_NAME = "Daman24"
DEVICE_ADDRESS = "5A19965D-1489-7BD7-F87F-E1C7B04BC2F9"   

 
TARGET_UUID = "00000023-0002-11e1-ac36-0002a5d5c51b"
class CharacteristicReader:
    def __init__(self):
        self.notification_count = 0
        self.max_notifications = 1000

    def notification_handler(self, char_uuid, data):
        """Handle incoming notifications"""
        self.notification_count += 1
        print(f"\nNotification {self.notification_count} from {char_uuid}:")
        print(f"Data: {data}")

async def read_characteristic(client):
    """Read and subscribe to the characteristic"""
    print(f"\nTesting UUID: {TARGET_UUID}")
    
    try:
        # Try reading
        try:
            data = await client.read_gatt_char(TARGET_UUID)
            print(f"Read value: {data}")
        except Exception as e:
            print(f"Read failed: {str(e)}")
    
        # Try notifications
        reader = CharacteristicReader()
        try:
            await client.start_notify(TARGET_UUID, lambda s, d: reader.notification_handler(TARGET_UUID, d))
            
            # Wait for notifications
            while reader.notification_count < reader.max_notifications:
                await asyncio.sleep(0.1)
            
            await client.stop_notify(TARGET_UUID)
            
        except Exception as e:
            print(f"Notification error: {str(e)}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

async def connect_to_device():
    device = await BleakScanner.find_device_by_name(DEVICE_NAME)
    
    if device is None:
        print(f"{DEVICE_NAME} not found by name, trying to connect using address...")
        device = DEVICE_ADDRESS  # Use the address directly

    async with BleakClient(device) as client:
        print(f"Connected to {device}")
        await read_characteristic(client)

if __name__ == "__main__":
    asyncio.run(connect_to_device())
