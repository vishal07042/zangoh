# AI Agent Supervisor Workstation - Customer Service Management Platform

A comprehensive real-time customer service management platform that enables supervisors to monitor AI agents, intervene in conversations, and manage response templates efficiently.

## 🚀 Features

### Real-Time Dashboard

-   **Live Metrics Updates**: Customer satisfaction scores, response times, active conversations, and escalation rates updated every 2 seconds via Server-Sent Events (SSE)
-   **Mobile Responsive Design**: Optimized for desktop, tablet, and mobile devices
-   **Visual Analytics**: Interactive charts and trend indicators
-   **Alert Management**: Real-time notifications for escalations, timeouts, and low satisfaction scores

### Conversation Management

-   **Live Conversation Monitoring**: View all customer conversations in real-time
-   **Supervisor Intervention**: Take over conversations from AI agents when needed
-   **Voice Input Support**: Use Web Speech API to dictate messages (Chrome, Edge, Safari)
-   **Response Templates**: Quick access to pre-built message templates with variable placeholders

### Template System

-   **Template Creation**: Create reusable response templates with variables
-   **Variable Support**: Dynamic placeholders like `{{customer_name}}`, `{{order_number}}`
-   **Category Organization**: Organize templates by type (greeting, resolution, escalation, etc.)
-   **Team Sharing**: Share templates across the supervisor team
-   **Usage Analytics**: Track template usage and success rates

### Agent Configuration

-   **AI Behavior Settings**: Adjust temperature, response time, escalation thresholds
-   **Capability Management**: Enable/disable specific AI capabilities (refunds, technical support, etc.)
-   **Preset Configurations**: Save and load configuration presets

## 🛠 Installation & Setup

### Prerequisites

-   **Node.js**: Version 16 or higher
-   **MongoDB**: Version 4.4 or higher
-   **Git**: For cloning the repository

### Backend Setup

1. **Navigate to the backend directory**:

    ```bash
    cd backend
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Environment Configuration**:
   Create a `.env` file in the backend directory:

    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/ai-supervisor
    CORS_ORIGIN=http://localhost:5173
    JWT_SECRET=your-jwt-secret-here
    NODE_ENV=development
    ```

4. **Start MongoDB**:

    ```bash
    # Using MongoDB service
    sudo systemctl start mongod

    # Or using Docker
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    ```

5. **Start the backend server**:

    ```bash
    npm run dev
    ```

    The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to the project directory**:

    ```bash
    cd project
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start the development server**:

    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:5173`

## 📱 Usage Guide

### Dashboard Overview

The dashboard provides real-time insights into your customer service operations:

1. **Metrics Cards**:

    - Customer Satisfaction Score (CSAT)
    - Average Response Time
    - Active Conversations
    - Escalation Rate

2. **Live Updates**: All metrics update automatically every 2 seconds

3. **Conversation Table**: View all customer conversations with filtering and search capabilities

4. **Alerts Panel**: Monitor high-priority alerts and escalations

### Managing Conversations

#### Viewing Conversations

1. Navigate to the **Conversations** page
2. Select a conversation from the left panel
3. View the complete message history
4. Monitor AI agent responses in real-time

#### Taking Over a Conversation

1. Click the **\"Take Over\"** button in the conversation header
2. The conversation status changes to \"Supervisor Controlled\"
3. Type your response or use voice input/templates
4. Send messages directly to the customer

#### Using Voice Input

1. Click the **microphone icon** in the message input area
2. Grant microphone permissions when prompted
3. Speak your message clearly
4. The system will convert speech to text automatically
5. Edit the text if needed before sending

**Browser Support for Voice Input**:

-   ✅ Chrome (recommended)
-   ✅ Microsoft Edge
-   ✅ Safari
-   ❌ Firefox (not supported)

### Template Management

#### Using Templates in Conversations

1. Click the **\"Template\"** button in the message input area
2. Browse available templates by category
3. Use the search function to find specific templates
4. Select a template to customize

#### Filling Template Variables

1. After selecting a template, fill in the required variables:

    - `{{customer_name}}`: The customer's name
    - `{{order_number}}`: Order or ticket reference
    - `{{issue_description}}`: Brief description of the issue
    - `{{resolution_steps}}`: Steps taken to resolve

2. Preview the final message before sending
3. Click **\"Use Template\"** to add it to your message input

#### Creating New Templates

Templates can be created through the Templates page or API:

**Template Structure**:

```json
{
  \"name\": \"Order Refund Response\",
  \"description\": \"Standard response for refund requests\",
  \"category\": \"resolution\",
  \"content\": \"Hi {{customer_name}}, I've processed your refund for order {{order_number}}. You should see the refund of {{refund_amount}} in your account within 3-5 business days. Is there anything else I can help you with?\",
  \"variables\": [
    {
      \"name\": \"customer_name\",
      \"description\": \"Customer's first name\",
      \"required\": true,
      \"type\": \"text\"
    },
    {
      \"name\": \"order_number\",
      \"description\": \"Order reference number\",
      \"required\": true,
      \"type\": \"text\"
    },
    {
      \"name\": \"refund_amount\",
      \"description\": \"Refund amount with currency\",
      \"required\": true,
      \"type\": \"text\"
    }
  ],
  \"useCase\": \"customer_service\",
  \"isPublic\": true
}
```

### Agent Configuration

#### Adjusting AI Behavior

1. Click **\"Agent Config\"** in the dashboard header
2. Modify settings:

    - **Temperature**: Controls response creativity (0.1-2.0)
    - **Max Tokens**: Maximum response length
    - **Response Time**: Target response time in seconds
    - **Escalation Threshold**: Confidence level for escalation (0-100)

3. Enable/disable capabilities:

    - Refund processing
    - Technical support
    - Billing inquiries
    - General questions

4. Save configuration or load from presets

## 🔧 API Documentation

### Authentication

All API endpoints require proper authentication headers:

```javascript
headers: {
  'Authorization': 'Bearer your-jwt-token',
  'Content-Type': 'application/json'
}
```

### Key Endpoints

#### Templates

-   `GET /api/templates` - List all templates
-   `POST /api/templates` - Create new template
-   `GET /api/templates/:id` - Get specific template
-   `PATCH /api/templates/:id` - Update template
-   `DELETE /api/templates/:id` - Delete template
-   `POST /api/templates/:id/preview` - Preview template with variables

#### Conversations

-   `GET /api/conversations` - List conversations
-   `GET /api/conversations/:id` - Get conversation details
-   `POST /api/conversations/:id/messages` - Send message
-   `PATCH /api/conversations/:id` - Update conversation status

#### Metrics (SSE)

-   `GET /api/metrics/stream` - Real-time metrics stream
-   `GET /api/metrics/snapshot` - Current metrics snapshot

### Real-Time Events

The application uses Server-Sent Events (SSE) for real-time updates:

```javascript
// Connect to metrics stream
const eventSource = new EventSource("/api/metrics/stream");

eventSource.onmessage = (event) => {
	const metrics = JSON.parse(event.data);
	// Update UI with new metrics
};
```

## 🎨 Mobile Responsiveness

The platform is fully responsive and optimized for different screen sizes:

### Desktop (1200px+)

-   Full sidebar navigation
-   Multi-column dashboard layout
-   Expanded conversation view
-   Complete alerts panel

### Tablet (768px - 1199px)

-   Collapsible navigation
-   Stacked dashboard cards
-   Responsive conversation layout
-   Condensed alerts

### Mobile (< 768px)

-   Bottom navigation bar
-   Single-column layout
-   Simplified conversation view
-   Overlay alerts

## 🔍 Troubleshooting

### Common Issues

**Voice Input Not Working**:

-   Ensure you're using a supported browser (Chrome, Edge, Safari)
-   Check microphone permissions in browser settings
-   Verify HTTPS connection (required for Web Speech API)

**SSE Connection Issues**:

-   Check CORS configuration in backend
-   Verify backend server is running on correct port
-   Ensure firewall allows WebSocket connections

**Template Variables Not Replacing**:

-   Verify variable names match exactly (case-sensitive)
-   Check for proper `{{variable_name}}` format
-   Ensure all required variables are filled

**Mobile Layout Issues**:

-   Clear browser cache and cookies
-   Check for JavaScript errors in console
-   Verify responsive meta tag in HTML

### Performance Optimization

**For High Traffic**:

-   Enable MongoDB indexing on frequently queried fields
-   Implement Redis caching for templates and configurations
-   Use CDN for static assets
-   Consider horizontal scaling with load balancers

**Memory Usage**:

-   Monitor SSE connections and implement connection limits
-   Implement conversation archiving for old data
-   Use pagination for large conversation lists

## 📊 Monitoring & Analytics

### Key Metrics to Track

-   Average response time trends
-   Escalation rate patterns
-   Template usage statistics
-   Customer satisfaction scores
-   Agent intervention frequency

### Alerts Configuration

Set up monitoring for:

-   Response times exceeding 2 minutes
-   CSAT scores below 3.0
-   Escalation rates above 60%
-   System errors and downtime

## 🔐 Security Considerations

-   **Authentication**: Implement JWT-based authentication
-   **Input Validation**: Sanitize all user inputs
-   **Rate Limiting**: Implement API rate limits
-   **HTTPS**: Use HTTPS in production
-   **Environment Variables**: Never commit secrets to version control

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**:

    ```env
    NODE_ENV=production
    PORT=3000
    MONGODB_URI=mongodb://your-production-mongodb
    CORS_ORIGIN=https://your-domain.com
    JWT_SECRET=your-secure-jwt-secret
    ```

2. **Build Frontend**:

    ```bash
    cd project
    npm run build
    ```

3. **Deploy with PM2**:

    ```bash
    npm install -g pm2
    pm2 start backend/index.js --name \"ai-supervisor-backend\"
    pm2 startup
    pm2 save
    ```

4. **Nginx Configuration**:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location /api {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            root /path/to/built/frontend;
            try_files $uri $uri/ /index.html;
        }
    }
    ```

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

For technical support or questions:

-   Create an issue in the GitHub repository
-   Contact the development team
-   Check the troubleshooting section above

---

**Built with modern web technologies for scalable customer service management** 🎯
