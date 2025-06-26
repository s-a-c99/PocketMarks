import type { Bookmark } from "@/types";

export const mockBookmarks: Bookmark[] = [
  {
    id: "1",
    title: "Vercel: Develop. Preview. Ship.",
    url: "https://vercel.com",
    description: "The platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.",
    tags: ["hosting", "nextjs", "development"],
    createdAt: "2023-10-26T10:00:00Z",
  },
  {
    id: "2",
    title: "Shadcn/UI: Beautifully designed components built with Radix UI and Tailwind CSS.",
    url: "https://ui.shadcn.com",
    description: "An open-source component library that you can copy and paste into your apps. Accessible. Customizable. Open Source.",
    tags: ["react", "components", "ui", "design"],
    createdAt: "2023-10-25T14:30:00Z",
  },
  {
    id: "3",
    title: "Tailwind CSS: A utility-first CSS framework for rapid UI development.",
    url: "https://tailwindcss.com",
    description: "Rapidly build modern websites without ever leaving your HTML. A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
    tags: ["css", "framework", "utility-first"],
    createdAt: "2023-10-25T11:20:00Z",
  },
  {
    id: "4",
    title: "Awwwards: Website Awards - Best Web Design Trends",
    url: "https://awwwards.com",
    description: "Awwwards are the Website Awards that recognize and promote the talent and effort of the best developers, designers and web agencies in the world.",
    tags: ["design", "inspiration", "web design"],
    createdAt: "2023-10-24T09:05:00Z",
  },
  {
    id: "5",
    title: "Smashing Magazine: For Web Designers And Developers",
    url: "https://smashingmagazine.com",
    description: "Smashing Magazine is an online magazine for web designers and developers, with a focus on useful, practical information.",
    tags: ["articles", "development", "web design"],
    createdAt: "2023-10-23T16:45:00Z",
  },
];
