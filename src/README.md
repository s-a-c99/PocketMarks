# PocketMarks - Your Personal Bookmark Hub

PocketMarks is a self-hosted, privacy-first, and user-friendly bookmarking utility designed for users who want full control over their data. It provides a clean, fast, and modern interface to manage your bookmarks.

![PocketMarks Screenshot](https://placehold.co/800x400.png?text=PocketMarks+App+Screenshot)

## Features

- **Organize Your Links:** Create bookmarks and nested folders to keep your links organized.
- **Modern Interface:** A clean and responsive UI with both Light and Dark modes.
- **Robust Import/Export:**
  - Import bookmarks from standard HTML files exported by any browser.
  - Choose to merge new links with your existing collection or replace it entirely.
  - A comparison view shows you exactly which new bookmarks will be added during a merge.
  - Export all or just a selection of your bookmarks back to a standard HTML file.
- **Dead Link Checker:** Scan your entire collection to find and flag links that are no longer working. Folders containing dead links are also highlighted for easy cleanup.
- **Duplicate Detection:** The app automatically detects when you're trying to add a URL that already exists in your collection and asks for confirmation.
- **Privacy First:** No external tracking or AI API calls. All your data stays within the application. Your bookmarks are stored in a simple `bookmarks.json` file, giving you full ownership.
- **Statistics Dashboard:** Get insights into your collection with a dashboard showing total counts, your most frequently saved domains, and more.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **AI Toolkit (available):** [Genkit](https://firebase.google.com/docs/genkit) (The framework is integrated but currently not used for any features to ensure 100% privacy).


## Local Development Setup

To run PocketMarks on your local machine, follow these steps:

1.  **Install Dependencies:** Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:** Create a new file named `.env.local` in the root of the project. This file will hold your private credentials. Add the following lines, replacing the example values with your desired username and password:
    ```
    POCKETMARKS_USERNAME=user
    POCKETMARKS_PASSWORD=test1
    ```
    This file is included in `.gitignore` and will not be committed to your repository, keeping your credentials safe.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open the App:** Open your browser and navigate to [http://localhost:9002](http://localhost:9002).
    **Tip:** Bookmark this address in your browser for easy access to your personal hub!

## Privacy and Anonymity

Since this is a self-hosted application that runs entirely on your machine, it is inherently private.
- **VPN:** It works perfectly with any VPN, as all traffic is local.
- **Tor Browser:** You can access your local server via Tor Browser without any issues.
- **No External Calls:** The application makes no external API calls, except for the "Dead Link Checker" feature, which must contact website domains to verify their status.

## Contributing

We welcome contributions! If you have ideas for new features, bug fixes, or improvements, please see our [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is open source and available under the [MIT License](LICENSE).
