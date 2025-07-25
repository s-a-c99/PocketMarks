# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a flexible, user-friendly, and privacy-first bookmarking utility designed to give you full control over your data. It adapts to your needs, providing a clean, fast, and modern interface to manage, organize, and access your bookmarks.

<img src="public/logo.png" data-ai-hint="app screenshot" alt="PocketMarks Screenshot" />

## Philosophy: You Choose Your Path

The core principle of PocketMarks is **total user control**. You decide where your data lives and what features you enable. Choose the path that's right for you:

-   **Run Locally (Maximum Privacy):** The simplest and most private option. Your data never leaves your computer.
-   **Deploy to the Cloud (Access Anywhere):** Host your own private version on Vercel for free to access your bookmarks from any device.
-   **Enable AI (Optional):** On either setup, you can optionally provide your own Google AI API key to unlock smart features like automatic tag suggestions.

Your bookmarks are always stored in a simple `bookmarks.json` file that you own, whether it's on your machine or your private cloud instance.

## Features & Capabilities

### **Core Functionality**
- **Smart Organization:** Create bookmarks and nested folders with unlimited depth for perfect organization
- **Modern Interface:** Clean, responsive UI with both Light and Dark modes that adapts to your preferences  
- **Favorites System:** Star your most important bookmarks for instant access and priority display
- **Duplicate Detection:** Automatic URL detection prevents duplicates with smart confirmation dialogs
- **Statistics Dashboard:** Comprehensive insights with counts, domain distribution, and usage patterns

### **🔄 Advanced Drag & Drop System**
- **Multi-Item Dragging:** Select multiple bookmarks and folders, then drag them together in a single operation
- **Professional Visual Feedback:** Count badges, rotation effects, scaling, shadows, and smooth animations
- **Cross-Folder Movement:** Seamlessly move items between folders with clear drop zone indicators
- **Parent Level Navigation:** Full-width drop zones with edge-to-edge detection for intuitive organization
- **Auto-Save:** All changes automatically saved to bookmarks.json with server validation
- **Custom Order Mode:** Precise manual organization with drag & drop in Custom Order sorting

### **Multi-Selection & Rectangle Selection**
- **Checkbox-Based Selection:** Precise selection using checkboxes in Custom Order mode for clean interaction
- **Rectangle Selection:** Draw selection rectangles with mouse for rubber band multi-selection
- **Real-Time Visual Feedback:** Items highlight instantly with color changes, scaling, and pulse animations
- **Smooth Transitions:** Polished CSS transitions and animations for professional feel
- **Hierarchical Selection:** Selecting folders automatically includes all contents with smart tracking
- **Bulk Operations:** Open all selected bookmarks in tabs or delete multiple items with confirmations
- **Selection Preview:** Visual preview of items being selected before finalizing
- **Mixed Selection Modes:** Combine checkbox clicks with rectangle selection for maximum flexibility

### **↩️ Undo/Redo System**
- **Complete History Tracking:** Every drag operation saved to history for reliable rollback capability
- **Visual Controls:** Dedicated undo/redo buttons with smart disabled states when unavailable
- **State Management:** Maintains position in history stack for both undo and redo operations
- **Drag Operation Focus:** Specifically tracks drag and drop changes for precise workflow control
- **Automatic Saving:** History snapshots created automatically before significant state changes
- **Error Recovery:** Fallback mechanism if drag operations fail or cause issues

### **🏷️ Advanced Tag Management**
- **Manual Tag Input:** Custom tags with dedicated input field and intelligent autocomplete
- **AI-Powered Suggestions:** Get up to 3 relevant tags automatically suggested by AI (optional)
- **Smart Memory:** Deleted tags remembered and won't be re-suggested for cleaner workflow
- **Click-to-Filter:** Click any tag to instantly filter bookmarks showing only that tag
- **Bulk Operations:** "Open All" button for tag-filtered results with confirmation for large sets

### **🔍 Enhanced Search & Discovery**
- **Global Search:** Search across bookmark titles, URLs, and tags simultaneously for comprehensive results
- **Real-Time Results:** Debounced search with loading indicators for smooth, responsive performance
- **Instant Filtering:** Results update as you type with optimized 300ms debounce timing
- **Clear Visual Feedback:** Loading spinners and enhanced placeholders guide user interaction

### **📊 Data Management & Import/Export**
- **Intelligent Merge:** Smart import system detects new links, prevents duplicates, enables clean merging
- **Robust Import/Export:** Universal browser compatibility with HTML export for backups and sharing
- **Selective Export:** Export all bookmarks or just selected items for curated collections
- **AI Context Creation:** Perfect for generating curated knowledge bases for AI projects
- **(Optional) AI-Powered Features:** Provide your own Google AI API key to enable automatic tag suggestions

## Screenshots

### Login Interface
<img src="public/screenshots/login-interface.png" alt="PocketMarks Login Interface" width="300" />

*Clean and secure login interface with username/password authentication*

### Main Dashboard - Light & Dark Mode
<img src="public/screenshots/main-dashboard-light.png" alt="PocketMarks Main Dashboard - Light Mode" width="4000" />

*Main dashboard in light mode showing bookmark organization with folders*

<img src="public/screenshots/main-dashboard-dark.png" alt="PocketMarks Main Dashboard - Dark Mode" width="4000" />

*Main dashboard in dark mode demonstrating the responsive UI*

### Analytics Dashboard - Light & Dark Mode
<img src="public/screenshots/analytics-dashboard-light.png" alt="PocketMarks Analytics Dashboard - Light Mode" width="1600" />

*Analytics dashboard in light mode showing bookmark statistics and insights*

<img src="public/screenshots/analytics-dashboard-dark.png" alt="PocketMarks Analytics Dashboard - Dark Mode" width="1600" />

*Analytics dashboard in dark mode with visual charts and domain distribution*


## Getting Started

---

### Option 1: Run Locally (Maximum Privacy & Simplicity)
This is the recommended path for most users. Your data will never leave your computer.

1.  **Download the Code:** Download the project files from this GitHub repository as a ZIP file.
2.  **Install Dependencies:** Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```
    If you see security warnings, quickly resolve them with:
    ```bash
    npm audit fix
    ```
3.  **Set Up Credentials:** Create a `.env.local` file in the project root directory to store your login credentials securely.

    **IMPORTANT:** The file must be named exactly `.env.local` (with the dot at the beginning) and placed in the root directory alongside `package.json`.

    ### Method 1: Terminal Commands (Recommended)

    **macOS/Linux Terminal:**
    ```bash
    echo "POCKETMARKS_USERNAME=your_username" > .env.local
    echo "POCKETMARKS_PASSWORD=your_password" >> .env.local
    ```

    **Windows Command Prompt:**
    ```cmd
    echo POCKETMARKS_USERNAME=your_username > .env.local
    echo POCKETMARKS_PASSWORD=your_password >> .env.local
    ```

    **Windows PowerShell:**
    ```powershell
    echo "POCKETMARKS_USERNAME=your_username" | Out-File -FilePath .env.local -Encoding utf8
    echo "POCKETMARKS_PASSWORD=your_password" | Out-File -FilePath .env.local -Append -Encoding utf8
    ```

    ### Method 2: Manual Creation

    1. Open your text editor (Notepad, VS Code, TextEdit, etc.)
    2. Create a new file with this exact content:
       ```
       POCKETMARKS_USERNAME=your_username
       POCKETMARKS_PASSWORD=your_password
       ```
    3. **Save as `.env.local`** in the project root directory
    4. **Make sure there's no extra `.txt` extension**

    ### Verify File Creation

    Check that the file was created correctly:

    **macOS/Linux:**
    ```bash
    ls -la .env.local
    cat .env.local
    ```

    **Windows:**
    ```cmd
    dir .env.local
    type .env.local
    ```

    ### Actual Project Structure
    ```
    PocketMarks/
    ├── .env.local          ← Your credentials file (HIDDEN - starts with dot)
    ├── .gitignore          ← Hidden file
    ├── apphosting.yaml
    ├── backups/
    ├── bookmarks.json
    ├── components.json
    ├── CONTRIBUTING.md
    ├── docs/
    ├── LICENSE
    ├── next.config.ts
    ├── package.json
    ├── public/
    ├── README.md
    ├── src/
    └── tailwind.config.ts
    ```

    **IMPORTANT:** `.env.local` is a **hidden file** (starts with a dot). You won't see it in normal file explorers unless you enable "Show hidden files". This is normal and expected!

    ### How to View Hidden Files (Optional)

    **macOS Finder:**
    - Press `Cmd + Shift + .` (dot) to toggle hidden files visibility

    **Windows File Explorer:**
    - Go to View tab → Check "Hidden items"
    - Or press `Alt` → View → Options → View tab → "Show hidden files"

    **Linux File Manager:**
    - Press `Ctrl + H` to toggle hidden files
    - Or View → Show Hidden Files

    **VS Code / Text Editors:**
    - Hidden files are usually visible by default in most code editors

    **Security Note:** This file is included in `.gitignore` and will not be committed to your repository.
4.  **Run the App:**
    ```bash
    npm run dev
    ```
    
    **IMPORTANT:** If you created the `.env.local` file after starting the server, you need to restart it:
    - Press `Ctrl+C` to stop the server
    - Run `npm run dev` again
    
    The server will show:
    ```
    ✓ Ready in [time]ms
    - Local: http://localhost:9002
    - Environments: .env.local
    ```

5.  **Access Your Hub:** Open your browser and navigate to [http://localhost:9002](http://localhost:9002).
    **Tip:** Bookmark this address in your browser for easy access!

### Managing the Development Server

**To stop the server:**

**Method 1:** In the terminal running the server:
```bash
Ctrl+C
```

**Method 2:** Force stop all Next.js processes:
```bash
pkill -f "next dev"
```

**Verify server is stopped:**
```bash
ps aux | grep next
```
Should only show: `grep --color=auto next` (the search command itself)

**Check server resource usage (optional):**
```bash
ps aux | grep next
htop
```

**Important:** The development server uses ~50-150MB RAM and minimal CPU when idle. It continues running in the background even if you close the terminal window. Always use one of the stop methods above to properly shut down the server when finished.

### Troubleshooting Login Issues

**Problem: "Invalid username or password" error**
- ✅ Check that `.env.local` exists in the project root
- ✅ Verify file content with `cat .env.local` (macOS/Linux) or `type .env.local` (Windows)
- ✅ Restart the development server (`Ctrl+C` then `npm run dev`)
- ✅ Ensure no extra spaces around the `=` sign
- ✅ Use the exact username/password from your `.env.local` file

**Problem: "File not found" when creating .env.local**
- ✅ Make sure you're in the project root directory (where `package.json` is located)
- ✅ Use `pwd` (macOS/Linux) or `cd` (Windows) to check your current directory
- ✅ The file name must start with a dot: `.env.local` (not `env.local`)
- ✅ Remember: `.env.local` is a hidden file - you won't see it in file explorer unless you enable "Show hidden files"
- ✅ Use terminal commands to verify: `ls -la .env.local` (macOS/Linux) or `dir .env.local` (Windows)

**Problem: Login page won't load**
- ✅ Check that the server is running: look for "Ready in" message
- ✅ Verify the URL is exactly `http://localhost:9002`
- ✅ Check if another process is using port 9002

---

### Option 2: Deploy to the Cloud (Access Anywhere - Free)
This option is for users who want to access their bookmarks from multiple devices (like a phone or tablet). It involves deploying your own private copy of PocketMarks to a free cloud hosting service called Vercel.

**Privacy Note:** With this method, your app runs on Vercel's servers. While your instance is private and Vercel's privacy policy prohibits them from accessing your data, the highest level of absolute privacy is achieved with local hosting (Option 1).

**Requirements:** This process requires creating a free account on both **GitHub** and **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fs-a-c99%2FPocketMarks&env=POCKETMARKS_USERNAME,POCKETMARKS_PASSWORD&envDescription=Enter%20a%20username%20and%20password%20to%20secure%20your%20PocketMarks%20instance.&project-name=pocketmarks-hub&repository-name=my-pocketmarks-hub)
  
<img src="public/screenshots/Vercel.png" alt="PocketMarks on Vercel Login Interface" width="400" />

1.  **Click the "Deploy with Vercel" button above.**
2.  You will be redirected to Vercel. It will prompt you to **sign up or log in, preferably using your GitHub account.** This is necessary for Vercel to create your personal copy of the code.
3.  Vercel will then ask you to configure the project. You must enter a `POCKETMARKS_USERNAME` and `POCKETMARKS_PASSWORD`. These are the credentials you will use to log into **your** PocketMarks app.
4.  Click **"Deploy"**. Vercel will build and deploy the application, giving you a unique URL (e.g., `my-pocketmarks-hub.vercel.app`).
5.  Navigate to that URL to access your private, online version of PocketMarks.

<img src="public/screenshots/Vercel-dashboard.png" alt="PocketMarks on Vercel dashboard" width="1200" />  

---

### Optional: Enable AI Features

PocketMarks supports an optional AI-powered feature that uses the Google Gemini API to enhance your bookmark management experience:

- **Automatic Tag Suggestions:** Get intelligent tag recommendations for your bookmarks based on their titles and URLs

To enable this feature:

1. **Get a Google AI API Key:** Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate your free API key.
2. **Add the Key to Your Environment:**
   - **For Local Use (Option 1):** Open your `.env.local` file and add the following line, replacing `YOUR_API_KEY` with the key you just generated:
     ```
     GOOGLE_API_KEY=YOUR_API_KEY
     ```
   - **For Vercel Deployments (Option 2):** In your Vercel project dashboard, go to "Settings" -> "Environment Variables". Add a new variable named `GOOGLE_API_KEY` and paste your key as the value.

**Important Notes:** This feature is free within **Gemini API's free tier limits**. By using it, you agree to Google's terms, which allow data usage to improve their AI models. Exceeding free tier limits may require a paid tier with costs based on token usage. This is an optional step that enhances functionality but involves sending bookmark titles and URLs to an external service.

---

## How to Sync Bookmarks Across Devices

The core philosophy of PocketMarks is **total user control**. It is designed to be the single source of truth for all your bookmarks. You consolidate your links from various browsers here, clean them up, and then distribute a pristine, organized collection back to your devices.

This manual synchronization, via import/export of a standard HTML file, is **the essence of true self-hosting**. It gives you unparalleled privacy and control, ensuring no data is ever sent to a third-party server without your explicit action. The order of bookmarks will be preserved.

### Step 1: Consolidating Your Bookmarks into PocketMarks

To start, you'll want to import all your existing bookmarks from your main browser. The process is very similar for Chrome, Firefox, Edge, and others.

#### Exporting from Your Browser
1.  Open your browser.
2.  Find the Bookmark Manager. This is often found in the main menu (usually an icon with three dots or lines in the top-right corner) under "Bookmarks". You can also try the keyboard shortcut `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac).
3.  In the Bookmark Manager, look for an "Export" or "Import and Backup" option.
4.  Select **Export Bookmarks to HTML...**.
5.  Choose a location to save the `bookmarks.html` file (e.g., your Desktop) and click **Save**.

#### Importing into PocketMarks
1.  In PocketMarks, click the **Import / Export** button.
2.  Select **Merge from file...**.
3.  Choose the `bookmarks.html` file you just saved.
4.  PocketMarks will show you a comparison of new bookmarks to be added. Confirm the import.
5.  Repeat this process for any other browsers you use to consolidate everything in one place.

### Step 2: Syncing Your Curated Collection to Other Devices

Once PocketMarks is your central, organized hub, you can sync this clean collection to all your other browsers and devices.

1.  **Export from PocketMarks**: Use the **Export** function to download a single, up-to-date HTML file containing all your links.
2.  **Transfer the File**: Move this HTML file to your other device. You can use a USB stick, send it to yourself via a private email, or any method you trust.
3.  **Import into Your Browser**:
    -   Open the browser on the new device.
    -   Go to the Bookmark Manager.
    -   For a perfect sync, it's best to first **delete all existing bookmarks** from the browser.
    -   Find the **Import** function and select the HTML file you transferred from PocketMarks.

The browser will **automatically** read the file and recreate the exact structure of folders and links from your PocketMarks collection. You do not need to add them one by one. This ensures every browser is a perfect mirror of your curated hub.

## Pro Tips

-   **Reordering Bookmarks:** If you need to do a major reorganization of your bookmarks (moving many items between folders), the fastest way is to do it directly in your main browser's bookmark manager, which is optimized for that task. Once you're done, simply use the "Replace from file..." option in PocketMarks to update your central hub with the new, clean structure.
-   **Create Curated Context for AI Projects:** Use the "Export selected..." feature to download a clean, focused HTML file, then upload this file as a knowledge base.

## Password Recovery

-   **For Local Instances:** You are in full control. Simply open the `.env.local` file on your computer to see the password you set.
-   **For Vercel Deployments:** Log in to your Vercel account, navigate to your PocketMarks project settings, and view the "Environment Variables" to see the username and password you configured.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **AI:** [Google Genkit](https://firebase.google.com/docs/genkit) (Optional)

---

## Support the Project

If you find this project useful, please consider supporting its development. Thank you!

- [Donate via PayPal](https://paypal.me/99sac?country.x=FR&locale.x=fr_FR)
- [Sponsor on GitHub](https://github.com/sponsors/s-a-c99)

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).
