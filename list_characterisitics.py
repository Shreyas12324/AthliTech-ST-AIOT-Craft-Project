import asyncio
from bleak import BleakScanner, BleakClient

async def list_characteristics():
    device = await BleakScanner.find_device_by_name("Daman24")
    if device is None:
        print("Device not found")
        return
        
    async with BleakClient(device) as client:
        services = await client.get_services()
        for service in services:
            print(f"\nService: {service.uuid}")
            for char in service.characteristics:
                print(f"  Characteristic: {char.uuid}")
                print(f"    Properties: {char.properties}")

asyncio.run(list_characteristics()) 
