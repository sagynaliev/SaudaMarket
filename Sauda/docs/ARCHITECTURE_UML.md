# Sauda Architecture UML (Updated)

Бұл диаграмма жобаның ағымдағы архитектурасын және қолданылған Design Pattern-дерді сипаттайды.

```mermaid
classDiagram
    %% 1. Creational Pattern: Product Factory
    class ProductFactory {
        +createProduct(data) ProductDisplay
    }
    class ProductDisplay {
        <<interface>>
        +getType() String
        +getFormattedDetails() String
    }
    class PhysicalProduct {
        +weight Number
    }
    class DigitalProduct {
        +fileSize String
    }
    ProductFactory ..> ProductDisplay : creates
    ProductDisplay <|-- PhysicalProduct
    ProductDisplay <|-- DigitalProduct

    %% 2. Structural Pattern: Payment Adapter
    class PaymentGateway {
        <<interface>>
        +pay(amount)
    }
    class StripeAdapter {
        +pay(amount)
    }
    class PayPalAdapter {
        +pay(amount)
    }
    PaymentGateway <|-- StripeAdapter
    PaymentGateway <|-- PayPalAdapter

    %% 3. Behavioral Pattern: Order Observer
    class Order {
        +id String
        +status String
        +attach(observer)
        +notify()
    }
    class OrderObserver {
        <<interface>>
        +update(data)
    }
    class EmailNotifier {
        +update(data)
    }
    class SMSNotifier {
        +update(data)
    }
    Order o-- OrderObserver : notifies
    OrderObserver <|-- EmailNotifier
    OrderObserver <|-- SMSNotifier
```

## Түсініктемелер:
- **Product Factory**: Платформадағы тауардың түріне қарай (физикалық немесе цифрлық) тиісті нысанды құрастырады.
- **Payment Adapter**: Әртүрлі төлем жүйелерін (Stripe, PayPal) бір интерфейс арқылы басқаруға мүмкіндік береді.
- **Order Observer**: Тапсырыс статусы өзгергенде пайдаланушыға автоматты түрде хабарлама (Email/SMS) жібереді.
