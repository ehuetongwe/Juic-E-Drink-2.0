// Shopping Cart State
let cart = [];
const SHIPPING_COST = 5.99;
let productQuantities = {}; // Track quantities for each product

// Initialize Stripe (TEST MODE - Use test key for development)
// Get your test key from: Stripe Dashboard → Developers → API keys → Publishable key (Test mode)
// Test keys start with 'pk_test_' - Never use live keys ('pk_live_') for testing!
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RkExhJyOFzlYZ85icg54mcoVKWQrw1TYTeOnOiZS53VACyFKpfWjrfgjy0AbmSIjT7sg3QitafBDPni9UjOVP1300036hMfaR'; // Replace with your test key: 'pk_test_51...'
let stripe = null;

// Initialize Stripe
function initializeStripe() {
    // Only initialize if we have a valid Stripe key
    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('YourPublishableKey')) {
        console.warn('Stripe not initialized: Please add your Stripe publishable key in script.js');
        return;
    }

    try {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    } catch (error) {
        console.error('Error initializing Stripe:', error);
    }
}

// Product Quantity Functions
function updateProductQuantity(productId, change) {
    if (!productQuantities[productId]) {
        productQuantities[productId] = 0;
    }

    productQuantities[productId] = Math.max(0, productQuantities[productId] + change);

    // Update display
    const qtyDisplay = document.getElementById(`qty-${productId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = productQuantities[productId];
    }
}

function addProductToCart(productId, productName, productPrice) {
    const quantity = productQuantities[productId] || 1;

    if (quantity === 0) {
        alert('Please select a quantity first');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(productPrice),
            quantity: quantity
        });
    }

    // Reset quantity after adding
    productQuantities[productId] = 0;
    const qtyDisplay = document.getElementById(`qty-${productId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = '0';
    }

    updateCartUI();
    saveCartToLocalStorage();

    // Show feedback
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        const btn = productCard.querySelector('.add-to-cart-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.style.background = '#3da870';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }
}

// Package Functions
function getSelectedFlavor(packageId) {
    const selectedFlavor = document.querySelector(`input[name="package-${packageId}-flavor"]:checked`);
    if (selectedFlavor) {
        return selectedFlavor.value === 'refresher' ? 'The Refresher' : 'The Reboot';
    }
    return 'The Refresher'; // Default
}

function addPackageToCart(packageId, packageName, packagePrice, bottleCount) {
    const selectedFlavor = getSelectedFlavor(packageId);
    const packageDisplayName = `${packageName} – ${selectedFlavor} (x${bottleCount})`;

    // Use a unique ID for packages (e.g., 100 + packageId to avoid conflicts with products)
    const packageCartId = 100 + packageId;

    const existingItem = cart.find(item => item.id === packageCartId && item.name === packageDisplayName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: packageCartId,
            name: packageDisplayName,
            price: parseFloat(packagePrice),
            quantity: 1,
            isPackage: true,
            bottles: bottleCount
        });
    }

    updateCartUI();
    saveCartToLocalStorage();

    // Show feedback
    const packageCard = document.querySelector(`[data-package-id="${packageId}"]`);
    if (packageCard) {
        const btn = packageCard.querySelector('.add-package-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.style.background = '#3da870';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }

    // Open cart modal to show the added item
    openCart();
}

// Legacy function for backward compatibility
function addToCart(productId, productName, productPrice) {
    addProductToCart(productId, productName, productPrice);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCartToLocalStorage();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
            saveCartToLocalStorage();
        }
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const cartButton = document.getElementById('cartButton');

    // Update cart count
    const count = getCartCount();
    const previousCount = parseInt(cartCount.textContent) || 0;
    cartCount.textContent = count;

    // Add visual feedback when items are added
    if (count > previousCount && count > 0) {
        // Animate cart icon
        if (cartButton) {
            cartButton.classList.add('cart-updated');
            setTimeout(() => {
                cartButton.classList.remove('cart-updated');
            }, 600);
        }

        // Animate cart count badge
        if (cartCount) {
            cartCount.classList.add('count-updated');
            setTimeout(() => {
                cartCount.classList.remove('count-updated');
            }, 600);
        }
    }

    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        if (clearCartBtn) clearCartBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name} (x${item.quantity})</div>
                </div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})" title="Remove">×</button>
                </div>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
        if (clearCartBtn) clearCartBtn.disabled = false;
    }

    // Update cart subtotal and total
    const subtotal = getCartTotal();
    const total = subtotal;
    if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
    cartTotal.textContent = total.toFixed(2);

    // Update order summary if on checkout page
    updateOrderSummary();
    // Update checkout modal summary
    updateCheckoutModalSummary();
}

function updateOrderSummary() {
    const summaryItems = document.getElementById('orderSummaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    const paymentTotal = document.getElementById('paymentTotal');

    if (summaryItems) {
        if (cart.length === 0) {
            summaryItems.innerHTML = '<p style="color: var(--text-light);">No items in cart</p>';
        } else {
            summaryItems.innerHTML = cart.map(item => `
                <div class="summary-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }

        const subtotal = getCartTotal();
        const total = subtotal + SHIPPING_COST;

        if (summarySubtotal) summarySubtotal.textContent = subtotal.toFixed(2);
        if (summaryTotal) summaryTotal.textContent = total.toFixed(2);
        if (paymentTotal) paymentTotal.textContent = total.toFixed(2);
    }
}

function saveCartToLocalStorage() {
    localStorage.setItem('juiceCart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('juiceCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Cart Modal Functions
function openCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

function clearCart() {
    if (cart.length === 0) return;

    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        productQuantities = {};
        updateCartUI();
        saveCartToLocalStorage();

        // Reset quantity displays
        document.querySelectorAll('.qty-display').forEach(display => {
            display.textContent = '0';
        });
    }
}

function proceedToCheckout() {
    if (cart.length === 0) return;

    if (window.isPreorderClosed) {
        alert('The pre-order window has closed. You can no longer place orders for this drop.');
        return;
    }

    closeCart();
    openCheckoutModal();
}

// Checkout Modal Functions
function openCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCheckoutModalSummary();
    }
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updateCheckoutModalSummary() {
    const modalItems = document.getElementById('checkoutModalItems');
    const modalSubtotal = document.getElementById('checkoutModalSubtotal');
    const modalTotal = document.getElementById('checkoutModalTotal');
    const modalPaymentTotal = document.getElementById('modalPaymentTotal');

    if (modalItems) {
        if (cart.length === 0) {
            modalItems.innerHTML = '<p style="color: var(--text-light);">No items in cart</p>';
        } else {
            modalItems.innerHTML = cart.map(item => `
                <div class="checkout-modal-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }

        const subtotal = getCartTotal();
        const total = subtotal + SHIPPING_COST;

        if (modalSubtotal) modalSubtotal.textContent = subtotal.toFixed(2);
        if (modalTotal) modalTotal.textContent = total.toFixed(2);
        if (modalPaymentTotal) modalPaymentTotal.textContent = total.toFixed(2);
    }
}

// Payment Processing for Modal using Stripe Checkout
async function handleModalPayment(event) {
    event.preventDefault();

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Check if Stripe is initialized
    if (!stripe) {
        alert('Payment system is not configured. Please add your Stripe publishable key in script.js to enable payments.\n\nFor now, this is a demo. Your order information has been saved.');

        // Still allow form submission for demo purposes
        const formData = {
            firstName: document.getElementById('modalFirstName').value,
            lastName: document.getElementById('modalLastName').value,
            email: document.getElementById('modalEmail').value,
            address: document.getElementById('modalAddress').value,
            city: document.getElementById('modalCity').value,
            state: document.getElementById('modalState').value,
            zipCode: document.getElementById('modalZipCode').value,
            phone: document.getElementById('modalPhone').value,
        };

        console.log('Order details (demo):', { items: cart, shipping: SHIPPING_COST, shippingInfo: formData });

        // Clear cart and reset form
        cart = [];
        updateCartUI();
        saveCartToLocalStorage();
        checkoutModalForm.reset();
        closeCheckoutModal();

        alert('Order placed successfully! (Demo mode)');
        return;
    }

    const submitButton = document.getElementById('submitModalPayment');
    const buttonText = document.getElementById('modal-button-text');
    const spinner = document.getElementById('modal-spinner');

    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');

    // Get form data
    const formData = {
        firstName: document.getElementById('modalFirstName').value,
        lastName: document.getElementById('modalLastName').value,
        email: document.getElementById('modalEmail').value,
        address: document.getElementById('modalAddress').value,
        city: document.getElementById('modalCity').value,
        state: document.getElementById('modalState').value,
        zipCode: document.getElementById('modalZipCode').value,
        phone: document.getElementById('modalPhone').value,
    };

    try {
        // Calculate total amount in cents
        const subtotal = getCartTotal();
        const total = subtotal + SHIPPING_COST;
        const totalInCents = Math.round(total * 100);

        // Prepare line items for Stripe Checkout
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));



        // Call your backend to create a Checkout Session
        // NOTE: You need to create a backend endpoint that creates a Stripe Checkout Session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lineItems: lineItems,
                shippingInfo: formData,
                successUrl: `${window.location.origin}${window.location.pathname}?success=true`,
                cancelUrl: `${window.location.origin}${window.location.pathname}?canceled=true`,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { sessionId } = await response.json();

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + (error.message || 'Please try again.'));

        // Re-enable button
        submitButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Payment Processing using Stripe Checkout
async function handlePayment(event) {
    event.preventDefault();

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Check if Stripe is initialized
    if (!stripe) {
        alert('Payment system is not configured. Please add your Stripe publishable key in script.js to enable payments.\n\nFor now, this is a demo. Your order information has been saved.');

        // Still allow form submission for demo purposes
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('checkoutEmail').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            phone: document.getElementById('phone').value,
        };

        console.log('Order details (demo):', { items: cart, shipping: SHIPPING_COST, shippingInfo: formData });

        // Clear cart and reset form
        cart = [];
        updateCartUI();
        saveCartToLocalStorage();
        document.getElementById('checkoutForm').reset();

        return;
    }

    const submitButton = document.getElementById('submitPayment');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');

    // Get form data
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('checkoutEmail').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        phone: document.getElementById('phone').value,
    };

    try {
        // Calculate total amount in cents
        const subtotal = getCartTotal();
        const total = subtotal + SHIPPING_COST;

        // Prepare line items for Stripe Checkout
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));



        // Call your backend to create a Checkout Session
        // NOTE: You need to create a backend endpoint that creates a Stripe Checkout Session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lineItems: lineItems,
                shippingInfo: formData,
                successUrl: `${window.location.origin}${window.location.pathname}?success=true`,
                cancelUrl: `${window.location.origin}${window.location.pathname}?canceled=true`,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { sessionId } = await response.json();

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + (error.message || 'Please try again.'));

        // Re-enable button
        submitButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from localStorage
    loadCartFromLocalStorage();

    // Initialize Stripe
    initializeStripe();

    // Initialize product quantities
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = parseInt(card.dataset.productId);
        if (!productQuantities[productId]) {
            productQuantities[productId] = 0;
        }
    });

    // Legacy add to cart buttons (if any remain)
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Only attach if not already handled by onclick
        if (!button.onclick) {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = parseInt(productCard.dataset.productId);
                    const productName = productCard.dataset.productName;
                    const productPrice = productCard.dataset.productPrice;

                    addProductToCart(productId, productName, productPrice);
                }
            });
        }
    });

    // Cart modal controls
    const cartButton = document.getElementById('cartButton');
    const closeCartBtn = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');

    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    // Close cart when clicking outside
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                closeCart();
            }
        });
    }

    // Checkout modal controls
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const checkoutModal = document.getElementById('checkoutModal');

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) {
                closeCheckoutModal();
            }
        });
    }

    // Checkout modal form submission
    const checkoutModalForm = document.getElementById('checkoutModalForm');
    if (checkoutModalForm) {
        checkoutModalForm.addEventListener('submit', handleModalPayment);
    }

    // Handle Stripe Checkout success/cancel redirects
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        // Clear cart on successful payment
        cart = [];
        updateCartUI();
        saveCartToLocalStorage();
        alert('Payment successful! Your order has been placed.');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
        alert('Payment was canceled. Your cart has been saved.');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Checkout form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handlePayment);
    }

    // Update order summary when cart changes
    updateOrderSummary();

    // Initialize flavor tabs - with a small delay to ensure DOM is ready
    setTimeout(() => {
        initializeFlavorTabs();
    }, 100);

    // Initialize countdown timers
    initializeCountdowns();

    // Initialize package flavor selection
    initializePackageFlavorSelection();
});

// Package Flavor Selection
function initializePackageFlavorSelection() {
    // Add event listeners to all flavor radio buttons
    document.querySelectorAll('.flavor-option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function () {
            // Update visual state of all options in the same group
            const flavorOptionsContainer = this.closest('.flavor-options');
            const allOptions = flavorOptionsContainer.querySelectorAll('.flavor-option');

            allOptions.forEach(option => {
                const optionRadio = option.querySelector('input[type="radio"]');

                if (optionRadio && optionRadio.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        });
    });

    // Initialize checked states on page load
    document.querySelectorAll('.flavor-option input[type="radio"]:checked').forEach(radio => {
        const flavorOption = radio.closest('.flavor-option');
        flavorOption.classList.add('selected');
    });
}

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Animate hamburger menu
        const spans = menuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
            const spans = menuToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }

        lastScroll = currentScroll;
    });
}

// Enhanced smooth scroll function with easing
function smoothScrollTo(targetPosition, duration = 800) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    // Easing function for smooth acceleration/deceleration
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));

        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

// Enhanced smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#' || !href) {
            return;
        }

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            // Get navbar height dynamically
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 70;

            // Calculate target position
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

            // Use custom smooth scroll for better control
            smoothScrollTo(targetPosition, 800);
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Form submission handler for contact form (Handled by Netlify Forms)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Send Message';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        const formData = new FormData(contactForm);
        const data = new URLSearchParams();
        for (const pair of formData) {
            data.append(pair[0], pair[1]);
        }

        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: data.toString()
        }).then(() => {
            alert('Thank you for your message! We\'ll get back to you soon at support@juicedrinks.biz.');
            contactForm.reset();
        }).catch((error) => {
            alert('There was an issue sending your message. Please try again later.');
            console.error(error);
        }).finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    });
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Newsletter Form
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        // Here you would typically send to your backend/email service
        alert('Thank you for subscribing! We\'ll keep you updated with our latest news and offers.');
        newsletterForm.reset();
    });
}

// Flavor Profiles Tabs - Initialize on page load
function initializeFlavorTabs() {
    // Get all flavor tabs
    const flavorTabs = document.querySelectorAll('.flavor-tab');

    console.log('Initializing flavor tabs, found:', flavorTabs.length);

    if (flavorTabs.length === 0) {
        console.warn('Flavor tabs not found');
        return;
    }

    // Set up click handlers for each tab
    flavorTabs.forEach((tab, index) => {
        console.log(`Setting up tab ${index}:`, tab.getAttribute('data-flavor'));

        tab.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const flavor = this.getAttribute('data-flavor');
            console.log('Tab clicked, flavor:', flavor);

            if (!flavor) {
                console.error('No data-flavor attribute found on tab');
                return;
            }

            // Remove active class from all tabs
            document.querySelectorAll('.flavor-tab').forEach(t => {
                t.classList.remove('active');
            });

            // Remove active class from all details
            document.querySelectorAll('.flavor-details').forEach(d => {
                d.classList.remove('active');
            });

            // Add active class to clicked tab
            this.classList.add('active');
            console.log('Active class added to tab');

            // Show corresponding details
            const detailsId = `${flavor}-details`;
            console.log('Looking for details with ID:', detailsId);
            const details = document.getElementById(detailsId);

            if (details) {
                details.classList.add('active');
                console.log('Details element found and activated');
            } else {
                console.error('Details element not found:', detailsId);
                // Try to find it another way
                const allDetails = document.querySelectorAll('.flavor-details');
                console.log('All flavor details found:', allDetails.length);
                allDetails.forEach((d, i) => {
                    console.log(`Detail ${i}:`, d.id);
                });
            }
        });
    });

    console.log('Flavor tabs initialization complete');
}

// Countdown Timer Functions
// Set your target dates here (format: 'YYYY-MM-DD HH:MM:SS')
// Example: '2024-12-31 23:59:59'
const PREORDER_DEADLINE = '2026-03-04 13:32:38'; // Pre-order window deadline
const DELIVERY_DATE = '2026-03-24 10:12:08'; // Juice delivery date

let preorderInterval = null;
let deliveryInterval = null;

function updateCountdown(targetDate, daysId, hoursId, minutesId, secondsId) {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const distance = target - now;

    if (daysId === 'preorderDays') {
        window.isPreorderClosed = distance < 0;
    }

    if (distance < 0) {
        // Countdown has ended
        document.getElementById(daysId).textContent = '0';
        document.getElementById(hoursId).textContent = '0';
        document.getElementById(minutesId).textContent = '0';
        document.getElementById(secondsId).textContent = '0';

        if (daysId === 'preorderDays') {
            handlePreorderClosed();
        }
        return false;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(daysId).textContent = days;
    document.getElementById(hoursId).textContent = hours;
    document.getElementById(minutesId).textContent = minutes;
    document.getElementById(secondsId).textContent = seconds;

    return true;
}

function startPreorderCountdown() {
    // Update immediately
    const isActive = updateCountdown(
        PREORDER_DEADLINE,
        'preorderDays',
        'preorderHours',
        'preorderMinutes',
        'preorderSeconds'
    );

    // Update every second
    if (preorderInterval) {
        clearInterval(preorderInterval);
    }

    preorderInterval = setInterval(() => {
        const isActive = updateCountdown(
            PREORDER_DEADLINE,
            'preorderDays',
            'preorderHours',
            'preorderMinutes',
            'preorderSeconds'
        );

        if (!isActive) {
            clearInterval(preorderInterval);
        }
    }, 1000);
}

function startDeliveryCountdown() {
    // Update immediately
    const isActive = updateCountdown(
        DELIVERY_DATE,
        'deliveryDays',
        'deliveryHours',
        'deliveryMinutes',
        'deliverySeconds'
    );

    // Update every second
    if (deliveryInterval) {
        clearInterval(deliveryInterval);
    }

    deliveryInterval = setInterval(() => {
        const isActive = updateCountdown(
            DELIVERY_DATE,
            'deliveryDays',
            'deliveryHours',
            'deliveryMinutes',
            'deliverySeconds'
        );

        if (!isActive) {
            clearInterval(deliveryInterval);
        }
    }, 1000);
}

function initializeCountdowns() {
    // Check if countdown elements exist
    if (document.getElementById('preorderDays')) {
        startPreorderCountdown();
    }

    if (document.getElementById('deliveryDays')) {
        startDeliveryCountdown();
    }
}

function handlePreorderClosed() {
    // Hide all Add to Cart buttons
    const allAddButtons = document.querySelectorAll('.add-to-cart-btn, .add-package-btn');
    allAddButtons.forEach(btn => btn.style.display = 'none');

    // Hide quantity controls for individual products
    const quantityControls = document.querySelectorAll('.quantity-selector');
    quantityControls.forEach(ctrl => ctrl.style.display = 'none');

    // Add closed message to product/package cards
    const productCards = document.querySelectorAll('.product-card');
    const packageCards = document.querySelectorAll('.package-card');

    const closedMessageHTML = `
        <div class="closed-window-msg">
            <p><strong>Pre-order window is closed.</strong></p>
            <p>Join our mailing list below to be notified of the next Juic'E drop!</p>
            <button class="btn btn-secondary mt-2" onclick="smoothScrollTo(document.querySelector('.newsletter').getBoundingClientRect().top + window.pageYOffset - 70, 800)">Sign Up Here</button>
        </div>
    `;

    productCards.forEach(card => {
        if (!card.querySelector('.closed-window-msg')) {
            card.insertAdjacentHTML('beforeend', closedMessageHTML);
        }
    });

    packageCards.forEach(card => {
        // Find a good place to insert the message: before actions or at the end
        const actionsContainer = card.querySelector('.package-actions');
        if (actionsContainer && !card.querySelector('.closed-window-msg')) {
            actionsContainer.insertAdjacentHTML('beforebegin', closedMessageHTML);
        }
    });

    // Disable the checkout button just in case
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Pre-orders Closed';
    }
}

// Note: Countdown initialization is added to the existing DOMContentLoaded listener
