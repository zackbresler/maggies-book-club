# Maggie's Book Club

A self-hosted web application for managing a small book club. Members can rate books, view discussion questions, and access external links to purchase or borrow books.

## Features

- **Book Management**: Search and add books from Open Library, track reading status
- **Rating System**: Members can rate books 1-5 stars
- **Discussion Questions**: Admins can add discussion questions to books
- **External Links**: Quick links to StoryGraph, Goodreads, Omaha Public Library, and Bookshop.org
- **User Management**: Invite-based registration with admin controls
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js (credentials provider)
- **Styling**: Tailwind CSS
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `NEXTAUTH_SECRET`: A secure random string (generate with `openssl rand -base64 32`)

3. Set up the database:

```bash
npx prisma migrate dev
npm run db:seed
```

This creates an admin user with:
- Email: `maggie@bookclub.local`
- Password: `changeme123`
- An initial invite code: `WELCOME1`

4. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. Create a `.env` file with your production settings:

```env
NEXTAUTH_SECRET=your-secure-secret-here
NEXTAUTH_URL=http://your-server:3000
```

2. Build and start with Docker Compose:

```bash
docker-compose up -d --build
```

3. Initialize the database (first time only):

```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### OpenMediaVault 7 (Docker Compose Plugin)

If you're running OMV7 with the [Docker Compose plugin](https://wiki.omv-extras.org/doku.php?id=omv7:omv7_plugins:docker_compose), you can deploy directly from the GitHub repo.

Create a new compose file in the OMV GUI with:

```yaml
services:
  app:
    build:
      context: https://github.com/zackbresler/maggies-book-club.git
    ports:
      - "3000:3000"
    volumes:
      - ${CHANGE_TO_COMPOSE_DATA_PATH}/bookclub:/app/data  # BACKUP
    environment:
      - DATABASE_URL=file:/app/data/bookclub.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
    restart: unless-stopped
```

Set the following in the compose plugin's `.env` file:

```env
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://<your-server-ip-or-hostname>:3000
```

After the container starts, initialize the database:

```bash
docker exec -it <container-name> npx prisma migrate deploy
docker exec -it <container-name> npm run db:seed
```

The `# BACKUP` comment on the volume tells OMV to include the SQLite database in its scheduled backups.

### Reverse Proxy

If running behind a reverse proxy (e.g., Nginx, Caddy, Traefik), set `NEXTAUTH_URL` to the public URL users will access in their browser:

```env
NEXTAUTH_URL=https://bookclub.yourdomain.com
```

NextAuth uses this for callback URLs, CSRF tokens, and redirects — if it doesn't match the public URL, authentication will break.

Make sure your reverse proxy forwards these headers:

- `Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

## Usage

### First Time Setup

1. Log in with the admin account (`maggie@bookclub.local` / `changeme123`)
2. Change the admin password (recommended)
3. Go to Admin panel and generate invite codes for members
4. Share invite codes with book club members

### Adding Books

1. Navigate to "Add Book"
2. Search for a book by title, author, or ISBN
3. Select from search results
4. Set initial status (Upcoming or Next)
5. Optionally add a synopsis

### Book Statuses

- **Upcoming**: Books for future consideration
- **Next**: The next book to read
- **Currently Reading**: The book being read now
- **Completed**: Finished books

Only admins can change book statuses.

### Rating Books

- Click the stars on the dashboard or book detail page
- Ratings are 1-5 stars
- View all member ratings on the book detail page

### Discussion Questions

Admins can add discussion questions to any book. Questions are displayed on the book detail page for members to reference during discussions.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Session encryption key | Required |
| `NEXTAUTH_URL` | Base URL of the app | `http://localhost:3000` |
| `ADMIN_EMAIL` | Initial admin email (seed) | `maggie@bookclub.local` |
| `ADMIN_PASSWORD` | Initial admin password (seed) | `changeme123` |
| `ADMIN_NAME` | Initial admin name (seed) | `Maggie` |

### Database Commands

```bash
# Run migrations
npx prisma migrate dev

# Seed the database
npm run db:seed

# View/edit data
npm run db:studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── books/             # Book pages
│   ├── login/             # Login page
│   ├── profile/           # User profile
│   └── register/          # Registration page
├── components/            # React components
│   ├── BookSearch.tsx
│   ├── DiscussionQuestions.tsx
│   ├── ExternalLinks.tsx
│   ├── Navbar.tsx
│   ├── ProtectedLayout.tsx
│   ├── RatingStars.tsx
│   └── SessionProvider.tsx
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── openlibrary.ts    # Open Library API
│   └── prisma.ts         # Prisma client
└── types/                # TypeScript types
```

## Data Persistence

The SQLite database is stored in the `data/` directory when using Docker. This directory is mounted as a volume to persist data between container restarts.

## License

MIT
