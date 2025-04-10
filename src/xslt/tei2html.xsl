<?xml version="3.0" encoding="UTF-8"?>
<!-- 
xsltproc  -o bhsa_OT_JON.html tei2html.xsl bhsa_OT_JON.xml
 -->
<xsl:stylesheet version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" 
    xmlns:orb="https://openreadersbibles.org/" 
    exclude-result-prefixes="tei">

    <xsl:param name="filenamebase"></xsl:param>

    <!-- Change output method to xml for XHTML and add doctype declaration -->
    <xsl:output method="html"
                version="5" 
                omit-xml-declaration="yes"
                indent="yes" 
                encoding="UTF-8"/>

    <xsl:template match="/" mode="#default">
        <!-- Produce one result document for the enter book -->
        <xsl:apply-templates select="/tei:TEI/tei:text/tei:body" mode="generate-document"/>
        <xsl:apply-templates select="/tei:TEI/tei:text/tei:body/tei:div[@type='chapter']" mode="generate-document"/>
    </xsl:template>

    <xsl:template match="tei:body" mode="generate-document">
        <!-- Produce one result document for each chapter -->
        <xsl:result-document method="html" href="{concat($filenamebase,'.html')}">
            <xsl:call-template name="html-document"/>
        </xsl:result-document>
    </xsl:template>

    <xsl:template match="tei:div[@type='chapter']" mode="generate-document">
        <xsl:result-document method="html" href="{concat($filenamebase,'-',@n,'.html')}">
            <xsl:call-template name="html-document"/>
        </xsl:result-document>
    </xsl:template>

    <!-- Template to produce an HTML document -->
    <xsl:template name="html-document">
        <xsl:variable name="biblical-language"><xsl:value-of select="/tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language[@scope='major']/@ident"/></xsl:variable>
        <html xmlns="http://www.w3.org/1999/xhtml">
            <xsl:attribute name="xml:lang"><xsl:value-of select="$biblical-language"/></xsl:attribute>
            <xsl:attribute name="lang"><xsl:value-of select="$biblical-language"/></xsl:attribute>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>
                    <xsl:value-of select="/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title"/>
                </title>
                <link rel="stylesheet" href="style.css"/>
                <script type="text/javascript" src="script.js"></script>
            </head>
            <body>
                <h1>
                    <xsl:value-of select="/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title"/>
                </h1>
                
                <div id="content">
                    <xsl:apply-templates select="."/>
                    <!-- <xsl:apply-templates select="tei:text/tei:body/tei:div[@type='chapter']"/> -->
                </div>
                
            </body>
        </html>
    </xsl:template>

    <!-- Template to match chapters -->
    <xsl:template match="tei:div[@type='chapter']">
        <div class="chapter" xmlns="http://www.w3.org/1999/xhtml">
            <span class="chapter-number"><xsl:value-of select="@local-n"/></span>
            <xsl:apply-templates/>
        </div>
    </xsl:template>


    <xsl:template match="tei:div[@type='verse']">
        <div class="verse" xmlns="http://www.w3.org/1999/xhtml">
            <span class="verse-number"><xsl:value-of select="@local-n"/></span>
            <!-- <xsl:value-of select="parent::tei:div/@n"/> -->
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <xsl:template match="tei:w">
        <xsl:variable name="id" select="@xml:id"/>
        <xsl:variable name="annotation" select="preceding-sibling::tei:span[@to=concat('#',current()/@xml:id)]"/>
        <span class="wd" xmlns="http://www.w3.org/1999/xhtml">
            <xsl:apply-templates/>
            <xsl:apply-templates select="following-sibling::*[1][self::tei:note]" mode="annotation"/>
        </span>
        <xsl:if test="$annotation">
            <xsl:apply-templates select="$annotation"/>
        </xsl:if>
    </xsl:template>

    <xsl:template match="tei:note[@type='gloss']" mode="annotation">
        <span class="annotation-toggle" onclick="toggleAnnotation(this)" xmlns="http://www.w3.org/1999/xhtml"><xsl:value-of select="@n"/>
        <div>
            <xsl:attribute name="class">annotation hidden</xsl:attribute>
            <xsl:attribute name="onclick">goAway(this)</xsl:attribute>
            <xsl:attribute name="dir"><xsl:value-of select="/tei:TEI/@orb:layout-direction"/></xsl:attribute>
            <xsl:if test="tei:gloss[@type='parsing']">
                <span class="parsing"><xsl:apply-templates select="tei:gloss[@type='parsing']/text()"/></span>
            </xsl:if>
            <xsl:if test="tei:gloss[@type='lexical-form']">
                <span class="lexical-form"><xsl:apply-templates select="tei:gloss[@type='lexical-form']/text()"/></span>
            </xsl:if>
            <xsl:if test="tei:gloss[@type='gloss']">
                <span class="gloss"><xsl:apply-templates select="tei:gloss[@type='gloss']/text()"/></span>
            </xsl:if>
        </div>
        </span>
    </xsl:template>

    <xsl:template match="tei:note[@type='gloss']"></xsl:template>

    <xsl:template match="tei:span">
        <span class="annotation-toggle" onclick="toggleAnnotation(this)" xmlns="http://www.w3.org/1999/xhtml"><xsl:value-of select="@n"/>
        <div>
            <xsl:attribute name="class">annotation hidden</xsl:attribute>
            <xsl:attribute name="onclick">goAway(this)</xsl:attribute>
            <xsl:attribute name="dir"><xsl:value-of select="/tei:TEI/@orb:layout-direction"/></xsl:attribute>
            <xsl:value-of select="text()"/>
        </div>
        </span>
    </xsl:template>

    <!-- Identity template to copy elements by default -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- Gobble tei:header -->
    <xsl:template match="tei:teiHeader">
    </xsl:template>

    <!-- Don't output tei:text (but do output its contents) -->
    <xsl:template match="tei:text">
        <xsl:apply-templates/>
    </xsl:template>

    <!-- Don't output tei:body (but do output its contents) -->
    <xsl:template match="tei:body">
        <xsl:apply-templates/>
    </xsl:template>

</xsl:stylesheet>