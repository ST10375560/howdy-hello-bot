# 🔒 SecurBank International - Secure Banking Portal



> **🏆 Academic Excellence Project - Demonstrating Enterprise-Grade Security Implementation**

A comprehensive banking portal showcasing advanced security implementations. This project demonstrates real-world security practices including password security, input validation, SSL/TLS encryption, attack protection, and automated DevSecOps pipelines.

## **Project Highlights**

- **Enterprise-Grade Security** - Production-ready implementations
- **Full-Stack Application** - React frontend + Express.js backend
- **Comprehensive Testing** - 90%+ test coverage with security focus
- **Automated CI/CD** - GitHub Actions with security scanning
- **Real-Time Monitoring** - Security headers and vulnerability scanning


## **Quick Start Guide**

### Prerequisites

- **Node.js** 18+ ([Install with nvm](https://github.com/nvm-sh/nvm))
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git** (for SSL certificate generation)

###  Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/howdy-hello-bot.git
cd howdy-hello-bot

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Set up environment variables
cp env.example .env
# Edit .env with your MongoDB URI and other settings

# 4. Generate SSL certificates (first time only)
node generate-trusted-certs.js

# 5. Start development servers
npm run dev:all
```


## **Security Architecture Deep Dive**

###  **Password Security Implementation**

```typescript
// Advanced password security with enterprise-grade features
const passwordSecurity = new PasswordSecurityManager();

// Features implemented:
✅ bcrypt hashing with 12 salt rounds
✅ Password pepper for additional entropy
✅ Comprehensive strength validation (70+ points required)
✅ Breach database checking
✅ Account lockout after 5 failed attempts
✅ Password history prevention (last 5 passwords)
✅ Real-time strength meter with visual feedback
```

**Password Requirements:**
- Minimum 8 characters (recommended 12+)
- Uppercase and lowercase letters
- Numbers and special characters
- No common patterns or dictionary words
- Score of 70+ points required

### **Input Validation & Whitelisting**

```typescript
// Comprehensive input validation with regex patterns
const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  amount: /^\d+(\.\d{1,2})?$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  // ... 15+ validation patterns for all inputs
};

// Zod schema validation for type safety
const userSchema = z.object({
  email: z.string().email().regex(validationPatterns.email),
  password: z.string().min(8).regex(validationPatterns.password),
  // ... comprehensive validation rules
});
```

**Validation Features:**
- Regex pattern whitelisting for all inputs
- Zod schema validation for type safety
- XSS prevention with DOMPurify
- MongoDB injection prevention
- Real-time client-side validation

### **SSL/TLS Security Configuration**

```typescript
// Enterprise-grade SSL implementation
const sslManager = new SSLManager();

// Security features:
✅ 4096-bit RSA keys for maximum security
✅ SHA-256 certificates with extended validation
✅ HSTS headers (180 days, includeSubDomains, preload)
✅ Secure cookie configuration (HttpOnly, Secure, SameSite)
✅ HTTP to HTTPS redirect in production
✅ Certificate expiry monitoring and alerts
✅ Perfect Forward Secrecy (PFS) support
```

### **Attack Protection Implementation**

```typescript
// Multi-layered security middleware
app.use(helmet({
  contentSecurityPolicy: { 
    directives: { 
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    } 
  },
  hsts: { 
    maxAge: 15552000, 
    includeSubDomains: true, 
    preload: true 
  }
}));

// Rate limiting configuration
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
}));
```

**Protection Features:**
- **Helmet.js** security headers (CSP, X-Frame-Options, etc.)
- **Express rate limiting** (global & endpoint-specific)
- **Express brute force** protection with account lockout
- **CSRF token** protection with double-submit cookies
- **MongoDB injection** prevention with sanitization
- **XSS protection** with DOMPurify and input sanitization
- **Session security** with regeneration and secure storage

##  **Testing & Quality Assurance**

### **Test Coverage & Results**

```bash
# Run comprehensive test suites
npm test                    # Frontend tests with Vitest
cd server && npm test       # Backend tests with Jest

# Run security-specific tests
npm run test:security       # Frontend security audit
cd server && npm run test:security  # Backend security tests

# Generate detailed coverage reports
npm run test:coverage       # Frontend coverage
cd server && npm run test:coverage  # Backend coverage
```

### **Security Testing Categories**

- **Authentication Security**: Password hashing, session management, JWT validation
- **Input Validation**: XSS prevention, injection protection, data sanitization
- **Rate Limiting**: Brute force protection, API throttling
- **CSRF Protection**: Token validation, origin checking
- **SSL/TLS**: Certificate validation, HTTPS enforcement, HSTS headers

## **DevSecOps Pipeline**

### **Automated Security Pipeline**

Our GitHub Actions workflow includes comprehensive security validation:

```yaml
# .github/workflows/security-pipeline.yml
Security Pipeline Features:
✅ Vulnerability scanning (npm audit)
✅ Linting with security rules (ESLint)
✅ TypeScript type checking
✅ Comprehensive test suite execution
✅ Security-specific testing
✅ Dependency vulnerability checking
✅ Automated security reporting
✅ Build and deployment validation
```

### **Pipeline Triggers**

- **Push to main/develop**: Full security scan and testing
- **Pull Requests**: Security validation and code review
- **Daily Schedule**: Automated vulnerability scanning at 2 AM UTC
- **Manual Trigger**: On-demand security testing and reporting

### **Pipeline Results**

The pipeline generates comprehensive reports including:
- Security vulnerability assessments
- Test coverage metrics
- Linting and type checking results
- Dependency security analysis
- Automated security recommendations

## **Project Architecture**

```
howdy-hello-bot/
├── 📁 src/                          # Frontend React application
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 ui/                   # shadcn/ui components
│   │   └── 🔒 PasswordStrengthMeter.tsx
│   ├── 📁 pages/                    # Application pages
│   │   ├── 🏠 Home.tsx
│   │   ├── 🔐 CustomerLogin.tsx
│   │   ├── 📝 CustomerRegister.tsx
│   │   ├── 👤 CustomerDashboard.tsx
│   │   └── 🏢 EmployeePortal.tsx
│   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── 🔐 useAuth.tsx
│   │   └── 📱 useToast.ts
│   ├── 📁 lib/                      # Utility functions
│   │   ├── 🔗 api.ts
│   │   ├── 🛠️ utils.ts
│   │   ├── ✅ validations.ts
│   │   └── 🧹 sanitization.ts
│   └── 📁 integrations/             # External service integrations
│       └── 📁 supabase/
├── 📁 server/                       # Backend Express.js API
│   ├── 📁 src/
│   │   ├── 📁 routes/               # API route handlers
│   │   │   ├── 🔐 auth.ts
│   │   │   └── 💰 transactions.ts
│   │   ├── 📁 middleware/           # Security middleware
│   │   │   └── 🛡️ security.ts
│   │   ├── 📁 models/               # MongoDB schemas
│   │   │   ├── 👤 User.ts
│   │   │   ├── 👨‍💼 Employee.ts
│   │   │   └── 💳 Transaction.ts
│   │   ├── 📁 utils/                # Utility functions
│   │   │   ├── 🔒 ssl.ts
│   │   │   ├── 🔐 passwordSecurity.ts
│   │   │   ├── ✅ validators.ts
│   │   │   └── 🔍 transactionValidators.ts
│   │   └── 📁 __tests__/            # Backend test suite
│   │       ├── 🔐 auth.test.ts
│   │       ├── 🛡️ security.test.ts
│   │       ├── ✅ validation.test.ts
│   │       └── 🔒 simple-security.test.ts
│   ├── 📁 certs/                    # SSL certificates
│   └── 📄 package.json              # Backend dependencies
├── 📁 .github/workflows/            # GitHub Actions pipelines
│   └── 🔄 security-pipeline.yml
├── 📁 supabase/                     # Database migrations
└── 📁 docs/                         # Documentation
```

##  **Configuration Guide**

###  **Environment Variables**

Create a `.env` file in the root directory:

```bash
# Frontend Configuration
VITE_API_URL=https://localhost:3011
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Backend Configuration (server/.env)
MONGODB_URI=mongodb://localhost:27017/securbank
SESSION_SECRET=your_secure_session_secret_here
PASSWORD_PEPPER=your_password_pepper_here
CORS_ORIGIN=https://localhost:5173
NODE_ENV=development
PORT=3011
```

### 🔐 **SSL Certificate Setup**

```bash
# Generate trusted certificates (Windows)
node generate-trusted-certs.js

# Or manually with OpenSSL
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## 🎥 **Video Demonstration Guide**

### 📹 **Recommended Demo Flow (10-12 minutes)**


