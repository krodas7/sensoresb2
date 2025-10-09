import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Look for any navigation or links to the login page or try to reload or scroll to find login form.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Enter username 'admin' and password 'admin123', then click the 'Entrar' button to attempt login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin123')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the user is redirected to the dashboard by checking the presence of dashboard navigation items
        dashboard_nav_items = ["Dashboard", "Temperaturas", "Ocupación", "Lotes", "Integración", "Proveedores", "Pesos Envío", "Fermentación", "Catación", "Inventario", "Empleados", "Asistencia", "Reportes", "Logs", "Usuarios", "Gestiones"]
        for item in dashboard_nav_items:
            assert await page.locator(f'text={item}').is_visible(), f"Dashboard navigation item '{item}' not visible"
        # Assert that the username 'Admin' is displayed on the dashboard
        assert await page.locator('text=Admin').is_visible(), "Username 'Admin' not visible on dashboard"
        # Assert that a JWT token is issued and stored in localStorage or sessionStorage
        jwt_token = await page.evaluate("() => window.localStorage.getItem('jwt') || window.sessionStorage.getItem('jwt')")
        assert jwt_token is not None and len(jwt_token) > 0, "JWT token not found or empty after login"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    