import {
  firstProduct,
  Product10mgEN,
  Product20mgEN,
  Product10mgFA,
  Product20mgFA,
  spfOne,
  spfTwo,
  spfThree,
  spfFour,
  bestSellerOne,
  bestSellerTwo,
  bestSellerThree,
  bestSellerFour,
  newArrOne,
  newArrTwo,
  newArrThree,
  newArrFour,
} from "../assets/images/index";
import { useTranslation } from "react-i18next";

export const faNavBarList = [
  {
    _id: 1001,
    title: "خانه",
    link: "/",
  },
  {
    _id: 1002,
    title: "محصولات",
    link: "/shop",
  },
  {
    _id: 1003,
    title: "درباره ما",
    link: "/about",
  },
  {
    _id: 1004,
    title: "ارتباط با ما",
    link: "contact",
  },
  {
    _id: 1005,
    title: "اخبار",
    link: "/journal",
  },
];
// =================== NavBarList Start here ====================
export const navBarList = [
  {
    _id: 1001,
    title: "Home",
    link: "/",
  },
  {
    _id: 1002,
    title: "Shop",
    link: "/shop",
  },
  {
    _id: 1003,
    title: "About",
    link: "/about",
  },
  {
    _id: 1004,
    title: "Contact",
    link: "contact",
  },
  {
    _id: 1005,
    title: "Journal",
    link: "/journal",
  },
];
// =================== NavBarList End here ======================
// =================== Special Offer data Start here ============
export const SplOfferData = [
 
  {
    _id: "1014",
    img: Product10mgEN,
    imgFarsi: Product10mgFA,
    productName: "Carbon Quantum Dots",
    productFarsiName: "کلوئید نقاط کوانتومی کربنی",
    price: "35",
    color: "10 mg/mL",
    badge: true,
    des: `Carbon quantum dots (CQDs) are regarded as a new type of carbon nanomaterials diameter of 
which is less than 10 nm with a zero-dimensional structure. These materials are classified based 
on variety in carbonization, polymerization, graphitization or doping to improve the optical 
performance by heteroatoms including boron, sulfur, phosphorus and nitrogen in forms of 
compounds like graphene quantum dots (GQDs), B, S, P or N-doped CQDs. These nanomaterials 
are synthesized through different mechanisms including hydrothermal method, microwaveassisted system, thermal etching, electrochemical and acidic oxidation of carbonous resources like 
citric acid, graphite, urea, biomasses, fullerene, black carbon, anthracite, petroleum coke, pyrene 
and so on. These compounds possess properties such as biocompatibility, strong dispersion in 
water and non-toxic organic solvents, physical and chemical stability, UV absorption ability and 
excellent fluorescence emission, and accordingly, are applied in synthesis of fluorescent polymers, 
UV-absorbent coatings, anti-spoofing labels, bio-sensors, photocatalysts, medical, biological and 
pharmaceutical applications, bio-imaging, and fluorescent scaffolds production.
`,
    desFarsi: `نقاط کوانتومی کربن (CQDs (کالس جدیدی از نانومواد کربنی با قطر کمتر از 10 نانومتر با ساختار صفر بعدی هستند. 
این مواد بر اساس تنوع آنها در کربنیزه شدن، پلیمریزاسیون، گرافیتی شدن و یا دوپینگ آنها برای بهبود عملکرد نوری توسط 
هترو اتم هایی مانند بور، گوگرد ، فسفر و نیتروژن به صورت ترکیباتی مانند: CQDs doped-N or P ,S ,B و یا نقاط 
کوانتومی گرافنی (GQDs (طبقه بندی می شوند . 
CQDs از روش های مختلف مانند پیرولیز، الکتروشیمی و اکسیداسیون اسیدی منابع کربندار مانند گرافیت، نشاسته، زیست 
توده ها، فلورن، کربن سیاه، آنتراسیت؛ کک نفتی، پیرن، سیتریک اسید، اوره به و غیره تهیه می شوند . CQDs زیست 
سازگار، محلول در آب و سمیت ناچیز دارد. 
این ترکیب ات دارای خواصی مانند زیست سازگار، سمیت ناچیز ، پخش شوندگی فوق العاده در آب و حالل ها ی آلی، ، پایداری 
فیزیکی و شیمیایی، قابلیت جذب پرتوها ی فرابنفش و نشر فلوئورسانس قوی می باشند.`,
  },
  {
    _id: "1015",
    img: Product20mgEN,
    imgFarsi: Product20mgFA,
    productName: "Carbon Quantum Dots",
    productFarsiName: "کلوئید نقاط کوانتومی کربنی",
    price: "35",
    color: "20 mg/mL",
    badge: true,
    des: `Carbon quantum dots (CQDs) are regarded as a new type of carbon nanomaterials diameter of 
which is less than 10 nm with a zero-dimensional structure. These materials are classified based 
on variety in carbonization, polymerization, graphitization or doping to improve the optical 
performance by heteroatoms including boron, sulfur, phosphorus and nitrogen in forms of 
compounds like graphene quantum dots (GQDs), B, S, P or N-doped CQDs. These nanomaterials 
are synthesized through different mechanisms including hydrothermal method, microwaveassisted system, thermal etching, electrochemical and acidic oxidation of carbonous resources like 
citric acid, graphite, urea, biomasses, fullerene, black carbon, anthracite, petroleum coke, pyrene 
and so on. These compounds possess properties such as biocompatibility, strong dispersion in 
water and non-toxic organic solvents, physical and chemical stability, UV absorption ability and 
excellent fluorescence emission, and accordingly, are applied in synthesis of fluorescent polymers, 
UV-absorbent coatings, anti-spoofing labels, bio-sensors, photocatalysts, medical, biological and 
pharmaceutical applications, bio-imaging, and fluorescent scaffolds production.
`,
    desFarsi: `نقاط کوانتومی کربن (CQDs (کالس جدیدی از نانومواد کربنی با قطر کمتر از 10 نانومتر با ساختار صفر بعدی هستند. 
    این مواد بر اساس تنوع آنها در کربنیزه شدن، پلیمریزاسیون، گرافیتی شدن و یا دوپینگ آنها برای بهبود عملکرد نوری توسط 
    هترو اتم هایی مانند بور، گوگرد ، فسفر و نیتروژن به صورت ترکیباتی مانند: CQDs doped-N or P ,S ,B و یا نقاط 
    کوانتومی گرافنی (GQDs (طبقه بندی می شوند . 
    CQDs از روش های مختلف مانند پیرولیز، الکتروشیمی و اکسیداسیون اسیدی منابع کربندار مانند گرافیت، نشاسته، زیست 
    توده ها، فلورن، کربن سیاه، آنتراسیت؛ کک نفتی، پیرن، سیتریک اسید، اوره به و غیره تهیه می شوند . CQDs زیست 
    سازگار، محلول در آب و سمیت ناچیز دارد. 
    این ترکیب ات دارای خواصی مانند زیست سازگار، سمیت ناچیز ، پخش شوندگی فوق العاده در آب و حالل ها ی آلی، ، پایداری 
    فیزیکی و شیمیایی، قابلیت جذب پرتوها ی فرابنفش و نشر فلوئورسانس قوی می باشند.`,
    }
];
// =================== Special Offer data End here ==============

// =================== PaginationItems Start here ===============

export const paginationItems = [
  {
    _id: "1014",
    img: Product10mgEN,
    imgFarsi: Product10mgFA,
    productName: "Carbon Quantum Dots",
    productFarsiName: "کلوئید نقاط کوانتومی کربنی",
    price: "35",
    color: "10 mg/mL",
    badge: true,
    des: `Carbon quantum dots (CQDs) are regarded as a new type of carbon nanomaterials diameter of 
    which is less than 10 nm with a zero-dimensional structure. These materials are classified based 
    on variety in carbonization, polymerization, graphitization or doping to improve the optical 
    performance by heteroatoms including boron, sulfur, phosphorus and nitrogen in forms of 
    compounds like graphene quantum dots (GQDs), B, S, P or N-doped CQDs. These nanomaterials 
    are synthesized through different mechanisms including hydrothermal method, microwaveassisted system, thermal etching, electrochemical and acidic oxidation of carbonous resources like 
    citric acid, graphite, urea, biomasses, fullerene, black carbon, anthracite, petroleum coke, pyrene 
    and so on. These compounds possess properties such as biocompatibility, strong dispersion in 
    water and non-toxic organic solvents, physical and chemical stability, UV absorption ability and 
    excellent fluorescence emission, and accordingly, are applied in synthesis of fluorescent polymers, 
    UV-absorbent coatings, anti-spoofing labels, bio-sensors, photocatalysts, medical, biological and 
    pharmaceutical applications, bio-imaging, and fluorescent scaffolds production.
    `,
        desFarsi: `نقاط کوانتومی کربن (CQDs (کالس جدیدی از نانومواد کربنی با قطر کمتر از 10 نانومتر با ساختار صفر بعدی هستند. 
    این مواد بر اساس تنوع آنها در کربنیزه شدن، پلیمریزاسیون، گرافیتی شدن و یا دوپینگ آنها برای بهبود عملکرد نوری توسط 
    هترو اتم هایی مانند بور، گوگرد ، فسفر و نیتروژن به صورت ترکیباتی مانند: CQDs doped-N or P ,S ,B و یا نقاط 
    کوانتومی گرافنی (GQDs (طبقه بندی می شوند . 
    CQDs از روش های مختلف مانند پیرولیز، الکتروشیمی و اکسیداسیون اسیدی منابع کربندار مانند گرافیت، نشاسته، زیست 
    توده ها، فلورن، کربن سیاه، آنتراسیت؛ کک نفتی، پیرن، سیتریک اسید، اوره به و غیره تهیه می شوند . CQDs زیست 
    سازگار، محلول در آب و سمیت ناچیز دارد. 
    این ترکیب ات دارای خواصی مانند زیست سازگار، سمیت ناچیز ، پخش شوندگی فوق العاده در آب و حالل ها ی آلی، ، پایداری 
    فیزیکی و شیمیایی، قابلیت جذب پرتوها ی فرابنفش و نشر فلوئورسانس قوی می باشند.`,
  },
  {
    _id: "1015",
    img: Product20mgEN,
    imgFarsi: Product20mgFA,
    productName: "Carbon Quantum Dots",
    productFarsiName: "کلوئید نقاط کوانتومی کربنی",
    price: "35",
    color: "20 mg/mL",
    badge: true,
    des: `Carbon quantum dots (CQDs) are regarded as a new type of carbon nanomaterials diameter of 
    which is less than 10 nm with a zero-dimensional structure. These materials are classified based 
    on variety in carbonization, polymerization, graphitization or doping to improve the optical 
    performance by heteroatoms including boron, sulfur, phosphorus and nitrogen in forms of 
    compounds like graphene quantum dots (GQDs), B, S, P or N-doped CQDs. These nanomaterials 
    are synthesized through different mechanisms including hydrothermal method, microwaveassisted system, thermal etching, electrochemical and acidic oxidation of carbonous resources like 
    citric acid, graphite, urea, biomasses, fullerene, black carbon, anthracite, petroleum coke, pyrene 
    and so on. These compounds possess properties such as biocompatibility, strong dispersion in 
    water and non-toxic organic solvents, physical and chemical stability, UV absorption ability and 
    excellent fluorescence emission, and accordingly, are applied in synthesis of fluorescent polymers, 
    UV-absorbent coatings, anti-spoofing labels, bio-sensors, photocatalysts, medical, biological and 
    pharmaceutical applications, bio-imaging, and fluorescent scaffolds production.
    `,
        desFarsi: `نقاط کوانتومی کربن (CQDs (کالس جدیدی از نانومواد کربنی با قطر کمتر از 10 نانومتر با ساختار صفر بعدی هستند. 
    این مواد بر اساس تنوع آنها در کربنیزه شدن، پلیمریزاسیون، گرافیتی شدن و یا دوپینگ آنها برای بهبود عملکرد نوری توسط 
    هترو اتم هایی مانند بور، گوگرد ، فسفر و نیتروژن به صورت ترکیباتی مانند: CQDs doped-N or P ,S ,B و یا نقاط 
    کوانتومی گرافنی (GQDs (طبقه بندی می شوند . 
    CQDs از روش های مختلف مانند پیرولیز، الکتروشیمی و اکسیداسیون اسیدی منابع کربندار مانند گرافیت، نشاسته، زیست 
    توده ها، فلورن، کربن سیاه، آنتراسیت؛ کک نفتی، پیرن، سیتریک اسید، اوره به و غیره تهیه می شوند . CQDs زیست 
    سازگار، محلول در آب و سمیت ناچیز دارد. 
    این ترکیب ات دارای خواصی مانند زیست سازگار، سمیت ناچیز ، پخش شوندگی فوق العاده در آب و حالل ها ی آلی، ، پایداری 
    فیزیکی و شیمیایی، قابلیت جذب پرتوها ی فرابنفش و نشر فلوئورسانس قوی می باشند.`,
  },
];
// =================== PaginationItems End here =================
