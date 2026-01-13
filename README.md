# Juic'E Drinks Website

A modern, clean, and responsive e-commerce website for an online juice business with integrated shopping cart and Stripe payment processing.

## Features

- **Modern Design**: Clean, minimalist design with smooth animations
- **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Shopping Cart**: Full shopping cart functionality with add/remove items and quantity controls
- **4 Juice Flavors**: Green Detox, Citrus Boost, Berry Blast, and Tropical Paradise
- **Shipping System**: Complete shipping address form with all 50 US states
- **Stripe Integration**: Ready for Stripe payment processing (requires backend setup)
- **Smooth Scrolling**: Enhanced navigation with smooth scroll effects
- **Interactive Elements**: Hover effects, animations, and mobile menu
- **Contact Form**: Functional contact form (ready for backend integration)
- **SEO Friendly**: Semantic HTML structure with proper meta tags

## File Structure

```
Juic'E Drinks website 2/
├── index.html          # Main HTML file
├── styles.css          # All styling and responsive design
├── script.js           # JavaScript for interactivity
└── README.md           # This file
```

## Getting Started

1. Open `index.html` in your web browser
2. That's it! No build process or dependencies required.

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #4CAF50;
    --secondary-color: #FF6B6B;
    /* ... */
}
```

### Content
- Update product information in the Products section
- Modify company information in the About section
- Change contact details in the Contact section

### Images
To add images:
1. Create an `assets/images/` folder
2. Add your images
3. Update the HTML to reference your image files

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Stripe Payment Setup

To enable real payments, you need to:

1. **Get Stripe Keys**: Sign up at [Stripe.com](https://stripe.com) and get your API keys
2. **Update Frontend**: Replace the placeholder Stripe key in `script.js`
3. **Create Backend**: Set up a backend server to create PaymentIntents (see `STRIPE_SETUP.md`)
4. **Test**: Use Stripe test cards to verify the integration

See `STRIPE_SETUP.md` for detailed instructions.

## Current Status

✅ Shopping cart functionality  
✅ Checkout form with shipping address  
✅ State selection (all 50 US states)  
✅ Stripe Elements integration (frontend ready)  
⚠️ Backend payment processing required (see STRIPE_SETUP.md)

## Next Steps

- Set up backend server for Stripe payment processing
- Add product images
- Set up analytics tracking
- Add order confirmation emails
- Implement order tracking
- Add product reviews/ratings

## License

This project is open source and available for personal and commercial use.

# Juic-E-Drink-2.0
