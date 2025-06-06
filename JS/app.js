// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    sendEmailVerification,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCMJKIoD7KQWMgLQdY32N6tSDM6DSOFAxM",
    authDomain: "frogstars-78ace.firebaseapp.com",
    projectId: "frogstars-78ace",
    storageBucket: "frogstars-78ace.firebasestorage.app",
    messagingSenderId: "529877303945",
    appId: "1:529877303945:web:dcbc4b32d45602cc88fc58",
    measurementId: "G-J2FKDS4N2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Email providers whitelist
const allowedEmailProviders = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'icloud.com',
    'protonmail.com',
    'tutanota.com',
    'yandex.com',
    'zoho.com',
    'aol.com',
    'proton.me'
];

// DOM Elements
const form = document.getElementById('registrationForm');
const inputs = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    terms: document.getElementById('terms'),
    newsletter: document.getElementById('newsletter')
};

const errorElements = {
    fullName: document.getElementById('fullNameError'),
    email: document.getElementById('emailError'),
    password: document.getElementById('passwordError'),
    confirmPassword: document.getElementById('confirmPasswordError'),
    terms: document.getElementById('termsError')
};

const successElements = {
    email: document.getElementById('emailSuccess'),
    confirmPassword: document.getElementById('confirmPasswordSuccess')
};

const submitBtn = document.getElementById('submitBtn');
const btnLoader = document.getElementById('btnLoader');
const passwordToggle = document.getElementById('passwordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
const passwordStrength = document.getElementById('passwordStrength');
const strengthFill = document.querySelector('.strength-fill');
const strengthText = document.querySelector('.strength-text');
const googleLoginBtn = document.getElementById('googleLogin');
const successModal = document.getElementById('successModal');
const modalOkBtn = document.getElementById('modalOkBtn');

// Validation functions
function validateName(name) {
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{2,50}$/;
    return nameRegex.test(name.trim());
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    return allowedEmailProviders.includes(domain);
}

function getPasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password),
        longLength: password.length >= 12
    };
    
    Object.values(checks).forEach(check => {
        if (check) score++;
    });
    
    if (score <= 2) return { strength: 'weak', text: 'Contraseña débil' };
    if (score <= 3) return { strength: 'fair', text: 'Contraseña regular' };
    if (score <= 4) return { strength: 'good', text: 'Contraseña buena' };
    return { strength: 'strong', text: 'Contraseña fuerte' };
}

function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    
    return {
        isValid: minLength && hasLower && hasUpper && hasNumber && hasSymbol,
        errors: {
            minLength: !minLength ? 'Mínimo 8 caracteres' : null,
            hasLower: !hasLower ? 'Al menos una minúscula' : null,
            hasUpper: !hasUpper ? 'Al menos una mayúscula' : null,
            hasNumber: !hasNumber ? 'Al menos un número' : null,
            hasSymbol: !hasSymbol ? 'Al menos un símbolo' : null
        }
    };
}

// UI Helper functions
function showError(field, message) {
    const errorElement = errorElements[field];
    const inputElement = inputs[field];
    
    if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.classList.add('error');
        inputElement.classList.remove('success');
        
        // Hide success message if exists
        if (successElements[field]) {
            successElements[field].classList.remove('show');
        }
    }
}

function showSuccess(field, message = '') {
    const successElement = successElements[field];
    const inputElement = inputs[field];
    const errorElement = errorElements[field];
    
    if (inputElement) {
        inputElement.classList.add('success');
        inputElement.classList.remove('error');
        
        // Hide error message
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        
        // Show success message if element exists and message provided
        if (successElement && message) {
            successElement.textContent = message;
            successElement.classList.add('show');
        }
    }
}

function clearValidation(field) {
    const errorElement = errorElements[field];
    const successElement = successElements[field];
    const inputElement = inputs[field];
    
    if (errorElement) errorElement.classList.remove('show');
    if (successElement) successElement.classList.remove('show');
    if (inputElement) {
        inputElement.classList.remove('error', 'success');
    }
}

function setLoadingState(loading) {
    submitBtn.disabled = loading;
    if (loading) {
        submitBtn.classList.add('loading');
    } else {
        submitBtn.classList.remove('loading');
    }
}

function showModal() {
    successModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    successModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Event Listeners
inputs.fullName.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    clearValidation('fullName');
    
    if (name && !validateName(name)) {
        showError('fullName', 'Nombre inválido. Solo letras y espacios (2-50 caracteres)');
    } else if (name && validateName(name)) {
        showSuccess('fullName');
    }
});

inputs.email.addEventListener('input', (e) => {
    const email = e.target.value.trim();
    clearValidation('email');
    
    if (email) {
        if (!validateEmail(email)) {
            const domain = email.includes('@') ? email.split('@')[1] : '';
            if (domain && !allowedEmailProviders.includes(domain.toLowerCase())) {
                showError('email', `Proveedor de email no permitido. Usa: ${allowedEmailProviders.slice(0, 3).join(', ')}, etc.`);
            } else {
                showError('email', 'Formato de email inválido');
            }
        } else {
            showSuccess('email', '✓ Email válido');
        }
    }
});

inputs.password.addEventListener('input', (e) => {
    const password = e.target.value;
    clearValidation('password');
    
    if (password) {
        passwordStrength.classList.add('show');
        
        const strength = getPasswordStrength(password);
        strengthFill.className = `strength-fill ${strength.strength}`;
        strengthText.textContent = strength.text;
        
        const validation = validatePassword(password);
        if (!validation.isValid) {
            const errors = Object.values(validation.errors).filter(Boolean);
            showError('password', errors.join(', '));
        } else {
            showSuccess('password');
        }
    } else {
        passwordStrength.classList.remove('show');
    }
    
    // Revalidate confirm password if it has value
    if (inputs.confirmPassword.value) {
        validateConfirmPassword();
    }
});

inputs.confirmPassword.addEventListener('input', validateConfirmPassword);

function validateConfirmPassword() {
    const password = inputs.password.value;
    const confirmPassword = inputs.confirmPassword.value;
    clearValidation('confirmPassword');
    
    if (confirmPassword) {
        if (password !== confirmPassword) {
            showError('confirmPassword', 'Las contraseñas no coinciden');
        } else {
            showSuccess('confirmPassword', '✓ Contraseñas coinciden');
        }
    }
}

inputs.terms.addEventListener('change', (e) => {
    clearValidation('terms');
    if (!e.target.checked) {
        showError('terms', 'Debes aceptar los términos y condiciones');
    }
});

// Password toggle functionality
passwordToggle.addEventListener('click', () => {
    togglePasswordVisibility(inputs.password, passwordToggle);
});

confirmPasswordToggle.addEventListener('click', () => {
    togglePasswordVisibility(inputs.confirmPassword, confirmPasswordToggle);
});

function togglePasswordVisibility(input, toggle) {
    const icon = toggle.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear all previous validations
    Object.keys(errorElements).forEach(clearValidation);
    
    const formData = {
        fullName: inputs.fullName.value.trim(),
        email: inputs.email.value.trim(),
        password: inputs.password.value,
        confirmPassword: inputs.confirmPassword.value,
        terms: inputs.terms.checked,
        newsletter: inputs.newsletter.checked
    };
    
    let isValid = true;
    
    // Validate all fields
    if (!formData.fullName) {
        showError('fullName', 'El nombre es requerido');
        isValid = false;
    } else if (!validateName(formData.fullName)) {
        showError('fullName', 'Nombre inválido');
        isValid = false;
    }
    
    if (!formData.email) {
        showError('email', 'El email es requerido');
        isValid = false;
    } else if (!validateEmail(formData.email)) {
        showError('email', 'Email inválido o proveedor no permitido');
        isValid = false;
    }
    
    if (!formData.password) {
        showError('password', 'La contraseña es requerida');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            const errors = Object.values(passwordValidation.errors).filter(Boolean);
            showError('password', errors.join(', '));
            isValid = false;
        }
    }
    
    if (!formData.confirmPassword) {
        showError('confirmPassword', 'Confirma tu contraseña');
        isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
        showError('confirmPassword', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    if (!formData.terms) {
        showError('terms', 'Debes aceptar los términos y condiciones');
        isValid = false;
    }
    
    if (!isValid) return;
    
    setLoadingState(true);
    
    try {
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Update user profile with full name
        await updateProfile(user, {
            displayName: formData.fullName
        });
        
        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            fullName: formData.fullName,
            email: formData.email,
            newsletter: formData.newsletter,
            createdAt: new Date(),
            emailVerified: false
        });
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Show success modal
        showModal();
        
        // Reset form
        form.reset();
        Object.keys(errorElements).forEach(clearValidation);
        passwordStrength.classList.remove('show');
        
    } catch (error) {
        console.error('Error creating account:', error);
        
        let errorMessage = 'Error al crear la cuenta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email ya está registrado';
                showError('email', errorMessage);
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es muy débil';
                showError('password', errorMessage);
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                showError('email', errorMessage);
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Registro con email/contraseña no habilitado';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Verifica tu internet';
                break;
            default:
                errorMessage = error.message || 'Error desconocido';
        }
        
        // Show general error if not field-specific
        if (!['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email'].includes(error.code)) {
            alert(errorMessage);
        }
    } finally {
        setLoadingState(false);
    }
});

// Google Sign In
googleLoginBtn.addEventListener('click', async () => {
    try {
        setLoadingState(true);
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            fullName: user.displayName,
            email: user.email,
            newsletter: false,
            createdAt: new Date(),
            emailVerified: user.emailVerified,
            provider: 'google'
        });
        
        showModal();
        
    } catch (error) {
        console.error('Error with Google Sign In:', error);
        
        let errorMessage = 'Error al iniciar sesión con Google';
        
        switch (error.code) {
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'Ya existe una cuenta con este email usando otro método';
                break;
            case 'auth/cancelled-popup-request':
            case 'auth/popup-closed-by-user':
                errorMessage = 'Inicio de sesión cancelado';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup bloqueado. Permite popups para este sitio';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Verifica tu internet';
                break;
            default:
                errorMessage = error.message || 'Error desconocido';
        }
        
        alert(errorMessage);
    } finally {
        setLoadingState(false);
    }
});

// Modal close functionality
modalOkBtn.addEventListener('click', hideModal);

// Close modal when clicking outside
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        hideModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successModal.classList.contains('show')) {
        hideModal();
    }
});

// Input focus animations
Object.values(inputs).forEach(input => {
    if (input.type !== 'checkbox') {
        input.addEventListener('focus', (e) => {
            e.target.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', (e) => {
            e.target.parentElement.classList.remove('focused');
        });
    }
});

// Form auto-save functionality (opcional)
function saveFormData() {
    const formData = {
        fullName: inputs.fullName.value,
        email: inputs.email.value,
        newsletter: inputs.newsletter.checked
    };
    // Nota: En un entorno real, podrías usar localStorage aquí
    // localStorage.setItem('registrationFormData', JSON.stringify(formData));
}

function loadFormData() {
    try {
        // Nota: En un entorno real, podrías cargar desde localStorage aquí
        // const savedData = localStorage.getItem('registrationFormData');
        // if (savedData) {
        //     const data = JSON.parse(savedData);
        //     if (data.fullName) inputs.fullName.value = data.fullName;
        //     if (data.email) inputs.email.value = data.email;
        //     if (data.newsletter) inputs.newsletter.checked = data.newsletter;
        // }
    } catch (error) {
        console.error('Error loading saved form data:', error);
    }
}

// Auto-save form data (excluding passwords)
[inputs.fullName, inputs.email, inputs.newsletter].forEach(input => {
    if (input) {
        input.addEventListener('input', saveFormData);
        input.addEventListener('change', saveFormData);
    }
});

// Real-time form validation status
function updateFormValidationStatus() {
    const isFormValid = 
        validateName(inputs.fullName.value.trim()) &&
        validateEmail(inputs.email.value.trim()) &&
        validatePassword(inputs.password.value).isValid &&
        inputs.password.value === inputs.confirmPassword.value &&
        inputs.terms.checked;
    
    submitBtn.style.opacity = isFormValid ? '1' : '0.7';
}

// Add real-time validation status updates
Object.values(inputs).forEach(input => {
    if (input) {
        input.addEventListener('input', updateFormValidationStatus);
        input.addEventListener('change', updateFormValidationStatus);
    }
});

// Prevent form submission on Enter key in password fields
[inputs.password, inputs.confirmPassword].forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = e.target === inputs.password ? inputs.confirmPassword : null;
            if (nextInput) {
                nextInput.focus();
            } else {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });
});

// Success handler for modal
function handleRegistrationSuccess() {
    // Opcional: Redirect después de un delay
    setTimeout(() => {
        // window.location.href = '/dashboard' o donde quieras redirigir
        console.log('Usuario registrado exitosamente');
    }, 2000);
}

// Update modal OK button to handle success
modalOkBtn.addEventListener('click', () => {
    hideModal();
    handleRegistrationSuccess();
});

// Add hover effects to form elements
document.querySelectorAll('.input-container').forEach(container => {
    container.addEventListener('mouseenter', () => {
        if (!container.querySelector('input:focus')) {
            container.style.transform = 'translateY(-1px)';
        }
    });
    
    container.addEventListener('mouseleave', () => {
        if (!container.querySelector('input:focus')) {
            container.style.transform = 'translateY(0)';
        }
    });
});

// Initialize